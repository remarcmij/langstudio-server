'use strict'
import {Request, Response, NextFunction} from 'express'
import * as jwt from 'jsonwebtoken'
import * as expressJwt from 'express-jwt'
import * as _ from 'lodash'

import {UserModel} from '../api/user/user.model'
import config from '../config/environment'

const compose = require('composable-middleware')
const validateJwt = expressJwt({secret: config.secrets.session})
const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;  // days * hours/day * minutes/hour * seconds/minute

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
export function isAuthenticated() {
    return compose()
    // Validate jwt
        .use(function (req: Request, res: Response, next: NextFunction) {
            // allow access_token to be passed through query parameter as well
            if (req.query && req.query.hasOwnProperty('access_token')) {
                req.headers['authorization'] = 'Bearer ' + req.query['access_token']
            }
            validateJwt(req, res, next)
        })
        // Attach user to request
        .use((req: Request, res: Response, next: NextFunction) => {
            UserModel.findById(req.user._id, (err, user) => {
                if (err) return next(err)
                if (!user) return res.sendStatus(401)
                if (user.disabled) return res.status(401).send('account disabled')
                req.user = user
                next()
            })
        })
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasRole(roleRequired: string) {
    if (!roleRequired) throw new Error('Required role needs to be set')

    return compose()
        .use(isAuthenticated())
        .use(function meetsRequirements(req: Request, res: Response, next: NextFunction) {
            if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
                next()
            }
            else {
                res.sendStatus(403)
            }
        })
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasProvider(providerName: string) {
    if (!providerName) throw new Error('Provider name needs to be set')

    return compose()
        .use(isAuthenticated())
        .use(function meetsRequirements(req: Request, res: Response, next: NextFunction) {
            if (req.user.provider === providerName) {
                next()
            }
            else {
                res.sendStatus(403)
            }
        })
}

/**
 * Returns a jwt token signed by the app secret
 */
export function signToken(id: string): string {
    return jwt.sign({_id: id}, config.secrets.session, {expiresIn: EXPIRES_IN_SECONDS})
}

/**
 * Set token cookie directly for oAuth strategies
 */
export function setTokenCookie(req: Request, res: Response): void {
    if (!req.user) {
        return void res.status(404).json({message: 'Something went wrong, please try again.'})
    }
    let token = signToken(req.user._id)
    res.cookie('token', JSON.stringify(token), {maxAge: EXPIRES_IN_SECONDS * 1000})
    res.redirect('/')
}

export function getAuthorizedGroups(req: Request): Array<string> | null {
    const publicGroups = ['public']
    let groups: Array<string> = []

    if (req.user) {
        if (req.user.role === 'admin') {
            return null
        }
        groups = req.user.groups
        groups = _.uniq(groups.concat(publicGroups))
    } else {
        groups = publicGroups
    }

    return groups
}
