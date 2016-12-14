'use strict'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import * as _ from 'lodash'

import * as log from '../../services/log.service'
import { UserModel } from './user.model'
import config from '../../config/environment'

let validationError = (res: Response, err: any) => res.status(422).json(err)

const unsafeFields = '-salt -hashedPassword -refreshToken'
/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req: Request, res: Response): void {
    Promise.resolve<any>(UserModel.find({})
        .sort('email')
        .select('-salt -hashedPassword -settings'))
        .then(users => {
            res.status(200).json(users)
        })
        .catch((err: any) => {
            res.status(500).send(err)
        })
}

/**
 * Creates a new user
 */
export function create(req: Request, res: Response, next: Function): void {
    let now = new Date()
    let newUser = new UserModel(req.body)
    newUser.provider = 'local'
    newUser.role = 'user'
    newUser.groups = ['public']
    newUser.created = now
    newUser.lastAccessed = now
    newUser.save((err, user) => {
        if (err) {
            validationError(res, err)
            return
        }
        let token = jwt.sign({ _id: user._id }, config.secrets.session, { expiresIn: '5h' })
        res.json({ token })
    })
}

/**
 * Get a single user
 */
export function show(req: Request, res: Response, next: Function): void {
    let userId = <string>req.params.id

    UserModel.findById(userId, (err: any, user: any) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            return res.sendStatus(401)
        }
        res.json(user.profile)
    })
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req: Request, res: Response): void {
    Promise.resolve<any>(UserModel.findByIdAndRemove(req.params.id).exec())
        .then(() => {
            res.sendStatus(204)
        })
        .catch(err => {
            res.status(500).send(err)
        })
}

/**
 * Change a users password
 */
export function changePassword(req: Request, res: Response, next: Function): void {
    let userId = <string>req.user._id
    let oldPass = <string>req.body.oldPassword
    let newPass = <string>req.body.newPassword

    Promise.resolve<any>(UserModel.findById(userId).exec())
        .then((user: any) => {
            if (user.authenticate(oldPass)) {
                user.password = newPass
                user.save((err: any) => {
                    if (err) {
                        validationError(res, err)
                        return
                    }
                    log.info('password changed', req)
                    res.sendStatus(200)
                })
            } else {
                res.sendStatus(403)
            }
        })
        .catch((err: any) => {
            res.status(500).json(err)
        })
}

export function googleUpdate(req: Request, res: Response) {
    let userId: string = req.user._id
    let name: string = req.body.name
    let email: string = req.body.email
    let googleId: string = req.body.googleId
    let imageUrl: string = req.body.googleImageUrl

    if (!(userId && name && email && googleId)) {
        res.sendStatus(400)
        return
    }

    Promise.resolve(UserModel.findById(userId))
        .then(user => {
            if (user.provider !== "google" || user.google.id !== googleId) {
                return void res.sendStatus(403)
            }

            user.name = name
            user.email = email
            user.google.image.url = imageUrl

            user.save((err: any) => {
                if (err) throw err
                res.sendStatus(200)
            })
        })
        .catch((err: any) => {
            res.sendStatus(500)
        })
}

export function changeGroups(req: Request, res: Response): void {
    let userId = <string>req.params.id
    let groups = <string[]>req.body.groups

    // should alway allow 'public'
    if (groups.indexOf('public') === -1) {
        groups.push('public')
    }

    Promise.resolve<any>(UserModel.findById(userId).exec())
        .then((user: any) => {
            user.groups = groups
            user.save((err: any): void => {
                if (err) {
                    return void res.status(422).json(err)
                }
                log.info('groups changed', req)
                return void res.sendStatus(200)
            })
        })
        .catch(err => {
            res.status(500).json(err)
        })
}

/**
 * Get my info
 */
export function me(req: Request, res: Response, next: Function): void {
    let userId = <string>req.user._id
    UserModel.findOne({
        _id: userId
    }, (err: any, user: any) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            return res.sendStatus(401)
        }

        user.lastAccessed = new Date()
        user.save()

        // remove sensitive and unnecessary fields
        let safeUser = _.omit(user.toObject(), ['salt', 'hashedPassword', 'refreshToken', 'settings'])

        log.info(`identity fetched: ${user.handle}`)
        res.json(safeUser)
    })
}

export function getSettings(req: Request, res: Response, next: Function): void {
    let userId = <string>req.user._id
    UserModel.findById(userId, 'settings', (err: any, user: any) => {
        if (err) {
            return next(err)
        }
        if (!user) {
            return res.sendStatus(401)
        }
        res.json(user.settings)
    })
}

export function putSettings(req: Request, res: Response, next: Function): void {
    let userId = <string>req.user._id
    UserModel.findOneAndUpdate(
        { _id: userId },
        { settings: req.body },
        { select: 'settings email' },
        (err: any, user: any) => {
            if (err) {
                return next(err)
            }
            if (!user) {
                return res.sendStatus(401)
            }
            log.debug(`settings updated`, req)
            res.json(user.settings)
        })
}

/**
 * Get user info
 */
export function getUser(req: Request, res: Response, next: Function): void {
    let userId = <string>req.params.id
    UserModel.findOne({
        _id: userId
    }, unsafeFields, (err: any, user: any) => { // don't ever give out the password or salt
        if (err) {
            return next(err)
        }
        if (!user) {
            return res.sendStatus(401)
        }
        // if (user.groups.indexOf('public') === -1) {
        //     user.groups.push('public')
        // }
        res.json(user)
    })
}

/**
 * Authentication callback
 */
export function authCallback(req: Request, res: Response, next: Function): void {
    res.redirect('/')
}
