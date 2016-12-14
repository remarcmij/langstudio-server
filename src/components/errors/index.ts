/**
 * Error responses
 */
'use strict'
import { Request, Response } from 'express'

module.exports[404] = function pageNotFound(req: Request, res: Response) {
    let viewFilePath = '404'
    let statusCode = 404
    let result = {
        status: statusCode
    }

    res.status(result.status)
    res.render(viewFilePath,  (err: any): void => {
        if (err) {
            return void res.status(result.status).json(result)
        }
        res.render(viewFilePath)
    })
}
