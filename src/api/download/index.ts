'use strict'
import { Router } from 'express'
import * as controller from './download.controller'

const router = Router()

router.get('/info/:file', controller.getInfo)
router.get('/get/:file', controller.getFile)

module.exports = router
