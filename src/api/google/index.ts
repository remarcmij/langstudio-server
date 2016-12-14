'use strict'
import { Router } from 'express'
const router = Router()
import * as controller from './google.controller'
import * as auth from '../../auth/auth.service'

router.get('/drive/get/:name', auth.isAuthenticated(), controller.getFile)
router.post('/drive/save/:name', auth.isAuthenticated(), controller.saveFile)

router.get('/drive/settings/get', auth.isAuthenticated(), controller.getSettings)
router.post('/drive/settings/save', auth.isAuthenticated(), controller.saveSettings)

module.exports = router
