'use strict'
import { Router } from 'express'

import * as articleController from './article.controller'
import * as hashTagController from './hashtag.controller'
import * as auth from '../../auth/auth.service'

const router = Router()

// note: hash is ignored by controller, only purpose is for browser cache busting
router.get('/public/get/:filename/:hash', articleController.getArticle)
router.get('/authed/get/:filename/:hash', auth.isAuthenticated(), articleController.getArticle)
router.get('/public/search', articleController.searchArticles)
router.get('/authed/search', auth.isAuthenticated(), articleController.searchArticles)
router.get('/authed/hashtag/search', auth.isAuthenticated(), hashTagController.searchHashTags)
router.get('/authed/hashtag/all', auth.isAuthenticated(), hashTagController.getAllHashTags)

module.exports = router
