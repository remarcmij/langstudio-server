'use strict'
import * as path from 'path'
import * as passport from 'passport'
import * as express from 'express'
import { Express } from 'express'
import * as  morgan from 'morgan'
import * as serveStatic from 'serve-static'
import * as compression from 'compression'
import * as  bodyParser from 'body-parser'
import * as methodOverride from 'method-override'
import * as cookieParser from 'cookie-parser'
import * as errorHandler from 'errorhandler'

import config from './environment'

const oneDay = 86400000

module.exports = function (app: Express): void {
    let env: string = app.get('env')

    app.set('views', config.root + '/server/views')
    app.engine('html', require('ejs').renderFile)
    app.set('view engine', 'html')
    app.use(compression())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(methodOverride('getter'))
    app.use(cookieParser())
    app.use(passport.initialize())

    let docRoot: string

    if ('production' === env) {
        docRoot = path.join(config.root, 'public')
        app.use(serveStatic(path.join(docRoot, 'favicon.ico')))
        app.use(express.static(docRoot, {
            maxAge: 0,
            setHeaders: (res, path) => {
                if (/\/[^/]+\.bundle\./.test(path) || /(?:otf|eot|svg|ttf|woff|woff2)$/.test(path)) {
                    res.setHeader('Cache-Control', 'public, max-age=' + oneDay * 30)
                }
            }
        }))
        app.use('/assets', express.static(path.join(docRoot, 'assets'), { maxAge: '30d' }))
        app.use(express.static(docRoot))
        app.set('appPath', docRoot)
        app.use(morgan('combined'))
    }

    if ('development' === env || 'test' === env) {
        docRoot = path.join(config.root, '../langstudio-client/dist')
        // app.use(require('connect-livereload')())
        app.use('/assets', express.static(path.join(docRoot, 'assets'), { maxAge: 1 }))
        app.use(express.static(docRoot, {
            maxAge: 0,
            setHeaders: (res, path) => {
                if (/\/[^/]+\.bundle\./.test(path) || /(?:otf|eot|svg|ttf|woff|woff2)$/.test(path)) {
                    res.setHeader('Cache-Control', 'public, max-age=' + 1)
                }
            }
        }))
        app.set('appPath', docRoot)
        app.use(morgan('dev'))
        app.use(errorHandler()); // error handler - has to be last
    }

}

// function setCustomCacheControl(res: express.Response, path: string): void {
//     if (express.static.mime.lookup(path) !== 'application/javascript') {
//         res.setHeader('Cache-Control', 'public, max-age=0')
//     }
// }
