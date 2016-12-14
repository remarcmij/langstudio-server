'use strict'
import * as httpRequest from 'request'
// require('request-debug')(httpRequest)
import * as log from '../../services/log.service'
import config from '../../config/environment'
import {UserData} from "../../api/user/user.model";

const FilesUri = 'https://www.googleapis.com/drive/v3/files'
const UploadUri = 'https://www.googleapis.com/upload/drive/v3/files'

export function getAccessToken(user: UserData): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!user.refreshToken) {
            return reject(new Error(`no refresh_token available for user ${user.email}`))
        }
        log.debug(`requesting Google access token`)
        httpRequest.post('https://www.googleapis.com/oauth2/v4/token', {
            form: {
                refresh_token: user.refreshToken,
                client_id: config.google.clientID,
                client_secret: config.google.clientSecret,
                grant_type: 'refresh_token'
            },
            json: true
        }, (error: any, response: any, body: any) => {
            if (handleError(reject, error, body)) {
                return
            }

            log.debug(`received Google access_token '${body.access_token}''`)
            resolve(body.access_token)
        })
    })
}

export function get(accessToken: string, options: any, fileId?: any): Promise<{}> {
    options = options || {}
    options.auth = {
        bearer: accessToken
    }

    let uri: string = FilesUri
    if (fileId) {
        uri += '/' + fileId
    }

    return new Promise<{}>((resolve, reject) => {
        httpRequest.get(uri,
            options, (error: any, response: any, body: any): void => {
                let contentType: string = response.headers['content-type']
                if (contentType.toLowerCase().indexOf('application/json') !== -1) {
                    let json: any = JSON.parse(body)
                    if (json.error) {
                        reject(new Error(json.error_description))
                    } else {
                        resolve(json)
                    }
                } else {
                    resolve(body)
                }
            })
    })
}

export function post(accessToken: string, options: any, upload?: string): Promise<{}> {
    options = options || {}
    options.json = true
    options.auth = {
        bearer: accessToken
    }

    return new Promise<{}>((resolve, reject) => {
        httpRequest.post(upload === 'upload' ? UploadUri : FilesUri,
            options, (error: any, response: any, body: any): void => {
                if (!handleError(reject, error, body)) {
                    resolve(body)
                }
            })
    })
}

export function patch(accessToken: string, fileId: string, options: any): Promise<{}> {
    options = options || {}
    options.json = true
    options.auth = {
        bearer: accessToken
    }

    return new Promise<{}>((resolve, reject) => {
        httpRequest.patch(UploadUri + '/' + fileId,
            options, (error: any, response: any, body: any): void => {
                if (!handleError(reject, error, body)) {
                    resolve(body)
                }
            })
    })
}

function handleError(reject: any, error: any, body: any): boolean {
    if (error) {
        reject(error)
        return true
    }

    if (body.error) {
        reject(new Error(`Google Drive error: ${body.error_description}`))
        return true
    }

    return false
}
