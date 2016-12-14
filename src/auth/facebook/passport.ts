'use strict'
import * as passport from 'passport'
import { Strategy, Profile } from 'passport-facebook'
import { UserModel } from '../../api/user/user.model'
import { Config } from '../../config/environment'

export function setup(config: Config): void {
    passport.use(new Strategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
        profileFields: ['displayName', 'name', 'email']
    }, (accessToken: string, refreshToken: string, profile: Profile, done: Function) => {
        UserModel.findOne({
            'facebook.id': profile.id
        }, (err, user): void => {
            if (!user) {
                user = new UserModel({
                    name: profile.displayName,
                    email: profile.emails ? profile.emails[0].value : 'unknown',
                    role: 'user',
                    groups: ['public'],
                    username: profile.username,
                    provider: 'facebook',
                    facebook: profile._json
                })
                user.save((err: any): void => {
                    if (err) {
                        return void done(err)
                    }
                    done(err, user)
                })
            } else {
                return void done(err, user)
            }
        })
    }))
}
