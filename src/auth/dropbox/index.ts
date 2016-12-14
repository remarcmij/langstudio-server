'use strict'
import { Request, Response, Router } from 'express'
import * as passport from 'passport'

const router = Router()

router
    .get('/', passport.authenticate('dropbox-oauth2'))

    .get('/callback', passport.authenticate('dropbox-oauth2', {
        failureRedirect: '/signup', // todo: change to some error screen
        session: false
    }), (req: Request, res: Response) => {
        res.redirect('/')
    })

module.exports = router
