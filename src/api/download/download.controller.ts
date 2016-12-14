'use strict'
import * as fs from 'fs'
import { Request, Response } from 'express'

import * as log from '../../services/log.service'

const DOWNLOADS_PATH = __dirname + '/../../../downloads/'

export function getInfo(req: Request, res: Response): void {
    let filename: string = req.params.file
    let filepath = DOWNLOADS_PATH + filename

    fs.lstat(filepath, (err, stats) => {
        if (err) {
            return void res.sendStatus(404)
        }
        res.json({
            size: stats.size,
            mtime: stats.mtime
        })
    })
}

export function getFile(req: Request, res: Response): void {

    let filename = <string>req.params.file
    let filepath = DOWNLOADS_PATH + filename

    res.download(filepath, filename, err => {
        if (err) {
            log.error(`file download failed: ${filename}, error: ${err.message}`, req)
        } else {
            log.info(`file ${filename} downloaded successfully`, req)
        }
    })
}

