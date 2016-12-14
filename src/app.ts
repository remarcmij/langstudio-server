'use strict'

require('mongoose').Promise = global.Promise

import * as path from 'path'
import * as  express from 'express'
import * as mongoose from 'mongoose'
import * as http from 'http'
const mkdirp = require('mkdirp')

import * as log  from './services/log.service'
import config from './config/environment'

const logpath = path.join(__dirname, '../log/')

// set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// connect to database
mongoose.connect(config.mongo.uri, config.mongo.options)

// populate DB with sample data
if (config.seedDB) {
    require('./config/seed')
}

// setup server
export let app = express()
app.enable('trust proxy')

require('./config/express')(app)
require('./routes')(app)

mkdirp(logpath, (err: Error) => {
    if (err) {
        console.error('mkdirp:' + logpath, err)
        return
    }

    // start server
    http.createServer(app)
        .listen(config.port, config.ip, () => {
            log.info(`Express server listening on ${config.port}, in ${app.get('env')} mode`)
        })
})
