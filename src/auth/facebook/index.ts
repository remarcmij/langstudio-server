'use strict'
import { Router } from 'express'
import * as passport from 'passport'
import * as  auth from '../auth.service'

const router = Router()

router
    // .get('/', () => {
    //     console.log('facebook login')
    //     passport.authenticate('facebook')
    // })
    .get('/', passport.authenticate('facebook', { scope: ['email'] }))

    .get('/callback', passport.authenticate('facebook', {
        failureRedirect: '/signup',
        session: false
    }), auth.setTokenCookie)

module.exports = router