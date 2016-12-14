'use strict'
import * as passport from 'passport'

import {UserModel} from '../../api/user/user.model'
import {Config} from '../../config/environment'

const LocalStrategy = require('passport-local').Strategy

exports.setup = (config: Config) => {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password' // this is the virtual field on the model
    }, (email: string, password: string, done: Function) => {
        UserModel.findOne({
            email: email.toLowerCase()
        }, (err, user) => {
            if (err) return done(err)

            if (!user) {
                return done(null, false, {message: 'This email is not registered.'})
            }
            if (!user.authenticate(password)) {
                return done(null, false, {message: 'This password is not correct.'})
            }
            return done(null, user)
        })
    }))
}