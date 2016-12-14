'use strict'
import { Router } from 'express'

import * as controller from './user.controller'
import * as auth from '../../auth/auth.service'

const router = Router()

router.get('/', auth.hasRole('admin'), controller.index)
router.get('/me/settings', auth.isAuthenticated(), controller.getSettings)
router.patch('/me/settings', auth.isAuthenticated(), controller.putSettings)
router.get('/me', auth.isAuthenticated(), controller.me)
router.get('/:id', auth.hasRole('admin'), controller.getUser)
router.delete('/:id', auth.hasRole('admin'), controller.destroy)
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword)
router.put('/:id/groups', auth.isAuthenticated(), controller.changeGroups)
router.post('/', controller.create)
router.post('/google/update', auth.isAuthenticated(), controller.googleUpdate)

module.exports = router
