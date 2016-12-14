'use strict'
import * as passport from 'passport'
import {OAuth2Strategy, Profile} from 'passport-google-oauth'
import {UserModel} from '../../api/user/user.model'
import {Config} from '../../config/environment'
// require("request-debug")(httpRequest)
const GoogleTokenStrategy = require('passport-google-id-token')

export function setup(config: Config): void {
    passport.use(new OAuth2Strategy({
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL
    }, oauthCallback))

    passport.use(new GoogleTokenStrategy(idTokenCallback))

    function oauthCallback(accessToken: string, refreshToken: string, profile: Profile, done: Function): void {
        UserModel.findOne({
            'google.id': profile.id
        }, (err, user): void => {
            if (!user) {
                let now = new Date()
                user = new UserModel({
                    name: profile.displayName,
                    email: profile.emails ? profile.emails[0].value : 'unknown',
                    role: 'user',
                    groups: ['public'],
                    username: profile.displayName,
                    provider: 'google',
                    refreshToken: refreshToken,
                    google: profile._json,
                    created: now,
                    lastAccessed: now
                })
            } else {
                if (refreshToken) {
                    user.refreshToken = refreshToken
                }
            }
            user.save((err: any): void => {
                if (err) {
                    return void done(err)
                }
                done(err, user)
            })
        })
    }

    function idTokenCallback(parsedToken: any, googleId: any, done: Function): void {
        let audience: String = parsedToken.aud
        // TODO: check audience against clientIDs
        UserModel.findOne({
            'google.id': googleId
        }, (err, user): void => {
            if (!user) {
                UserModel.create({
                    role: 'user',
                    groups: ['public'],
                    provider: 'google',
                    google: {id: googleId}
                }, done)
            } else {
                done(err, user)
            }
        })
    }
}
