'use strict'
import { Router } from 'express'

import config from '../config/environment'
import * as auth from './auth.service'

// Passport Configuration
require('./local/passport').setup(config)
require('./facebook/passport').setup(config)
require('./google/passport').setup(config)
// require('./dropbox/passport').setup(config)

const router = Router()

router.use('/local', require('./local'), auth.setTokenCookie)
router.use('/facebook', require('./facebook'))
router.use('/google', require('./google'))
router.use('/dropbox', require('./dropbox'))

module.exports = router