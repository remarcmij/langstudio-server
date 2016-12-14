'use strict'
import * as path from 'path'
import * as winston from 'winston'
import {Request} from 'express'

const logpath = path.join(__dirname, '../../log/')

winston.loggers.add('std', {
    console: {
        level: 'debug',
        colorize: true
    },
    file: {
        filename: logpath + 'taalmap.log',
        level: 'info',
        maxsize: 1000000,
        json: true
    }
})

const log = winston.loggers.get('std')

export function debug(message: string, req?: Request) {
    if (req) {
        log.debug(message, {user: req.user ? req.user.handle : 'anonymous'})
    } else {
        log.debug(message)
    }
}

export function info(message: string, req?: Request) {
    if (req) {
        log.info(message, {user: req.user ? req.user.handle : 'anonymous'})
    } else {
        log.info(message)
    }
}

export function warn(message: string, req?: Request) {
    if (req) {
        log.warn(message, {user: req.user ? req.user.handle : 'anonymous'})
    } else {
        log.warn(message)
    }
}

export function error(message: string, req?: Request) {
    if (req) {
        log.error(message, {user: req.user ? req.user.handle : 'anonymous'})
    } else {
        log.error(message)
    }
}

export function silly(message: string, req?: Request) {
    if (req) {
        log.log('silly', message, {user: req.user ? req.user.handle : 'anonymous'})
    } else {
        log.log('silly', message)
    }
}
