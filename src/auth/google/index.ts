'use strict'
import {Router} from 'express'
import * as passport from 'passport'
import * as auth from '../auth.service'

const router = Router()

router
    .get('/', passport.authenticate('google', {
        failureRedirect: '/signup', // todo: change to some error screen
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/drive.file'
        ],
        accessType: 'offline',
        // prompt: 'consent',
        session: false
    }))

    .get('/callback', passport.authenticate('google', {
        failureRedirect: '/signup', // todo: change to some error screen
        session: false
    }), auth.setTokenCookie)

    .post('/idtoken',
        passport.authenticate('google-id-token', {
            session: false
        }), (req, res) => {
            if (req.user) {
                let token = auth.signToken(req.user._id)
                res.json({token: token})
            } else {
                res.sendStatus(401)
            }
        })

module.exports = router
