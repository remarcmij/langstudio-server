'use strict'
import { Router } from 'express'

import * as search from './search'
import * as auth from '../../auth/auth.service'

const router = Router()

router.get('/autocomplete/:text', search.autoCompleteSearch)
router.get('/public/:word/:attr/:chunk', search.dictSearch)
router.get('/authed/:word/:attr/:chunk', auth.isAuthenticated(), search.dictSearch)

module.exports = router
