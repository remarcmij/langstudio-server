'use strict'
import { Router } from 'express'
import * as topicController from './topic.controller'
import * as uploadController from './upload.controller'
import * as auth from '../../auth/auth.service'
const router = Router()

router.get('/public/:pub', topicController.getPublication)
router.get('/authed/:pub', auth.isAuthenticated(), topicController.getPublication)
router.get('/public', topicController.getCollection)
router.get('/authed', auth.isAuthenticated(), topicController.getCollection)
router.get('/app', auth.isAuthenticated(), topicController.getAppTopics)
router.get('/admin', auth.hasRole('admin'), topicController.getAdminTopics)
router.delete('/admin/:filename', auth.hasRole('admin'), uploadController.removeTopic)
router.get('/groups', topicController.getGroupInfo)
router.post('/', auth.hasRole('admin'), uploadController.uploadFile)

module.exports = router
