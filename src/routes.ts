/**
 * Main application routes
 */

'use strict'
import { Express } from 'express'

const errors = require('./components/errors')

module.exports = function (app: Express) {

    app.all('/api/*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With')
        next()
    })

    // Insert routes below
    app.use('/api/topics', require('./api/topic'))
    app.use('/api/upload', require('./api/topic'))
    app.use('/api/article', require('./api/article'))
    app.use('/api/search', require('./api/dict'))
    app.use('/api/download', require('./api/download'))
    app.use('/api/google', require('./api/google'))
    app.use('/api/users', require('./api/user'))
    app.use('/auth', require('./auth'))

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404])

    // All other routes should redirect to the index.html
    app.route('/*')
        .get(function (req, res) {
            res.sendFile('index.html', { root: app.get('appPath') })
        })
}
