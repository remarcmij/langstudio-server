'use strict'
import {Request, Response} from 'express'
import * as log from '../../services/log.service'
import * as googleDrive from '../../auth/google/drive'

const DATA_FOLDER_NAME: string = 'belajar'
const APP_DATA_FOLDER: string = 'appDataFolder'
const KIND_FILE_LIST: string = 'drive#fileList'
const KIND_FILE: string = 'drive#file'
const APP_SETTINGS_FILE: string = 'settings.json'

interface ClientFileData {
    text: string
    lastModified: number
}

export function getFile(req: Request, res: Response): void {
    if (!assertGoogleUser(req.user)) {
        return void res.sendStatus(401)
    }

    let filename: string = req.params.name
    if (!filename) {
        log.error(`google.controller.getFile: incomplete request: missing filename`, req)
        return void res.sendStatus(400)
    }

    googleDrive.getAccessToken(req.user)
        .then(accessToken => {

            log.debug(`google.controller.getFile: attempting to get fileResource for: ${filename}`, req)

            return googleDrive.get(accessToken, {
                qs: {
                    spaces: 'drive',
                    q: `name='${filename}' and trashed=false`,
                    orderBy: 'modifiedTime desc'
                }
            }).then((fileList: GoogleDriveV3FileList) => {
                assertKind(fileList, KIND_FILE_LIST, 'getFile')

                if (fileList.files.length === 0) {
                    log.debug(`google.controller.getFile: file not found`, req)
                    return void res.sendStatus(404)
                }

                log.debug(`google.controller.getFile: received fileResource - now attempting to get file data`, req)

                return googleDrive.get(accessToken, {
                    qs: {
                        alt: 'media'
                    }
                }, fileList.files[0].id)
                    .then(data => {
                        log.debug(`google.controller.getFile: received file data`, req)
                        res.json({ text: data })
                    })
            })
        }).catch(err => {
            log.error(`google.controller.getFile: ${err.toString()}`, req)
            res.json({ error: err.message })
        })
}

export function getSettings(req: Request, res: Response): void {
    if (!assertGoogleUser(req.user)) {
        return void res.sendStatus(401)
    }

    googleDrive.getAccessToken(req.user)
        .then(accessToken => {

            log.debug(`google.controller.getSettings: attempting to get fileResource for: ${APP_SETTINGS_FILE}`, req)

            return googleDrive.get(accessToken, {
                qs: {
                    spaces: APP_DATA_FOLDER,
                    q: `name='${APP_SETTINGS_FILE}' and trashed=false`,
                    orderBy: 'modifiedTime desc'
                }
            }).then((fileList: GoogleDriveV3FileList) => {
                assertKind(fileList, KIND_FILE_LIST, 'getSettings')

                if (fileList.files.length === 0) {
                    log.debug(`google.controller.getSettings: file not found`, req)
                    return void res.sendStatus(404)
                }

                log.debug(`google.controller.getSettings: received fileResource - now attempting to get file data`, req)

                return googleDrive.get(accessToken, {
                    qs: {
                        alt: 'media'
                    }
                }, fileList.files[0].id)
                    .then((data: any) => {
                        log.debug(`google.controller.getSettings: received file data`, req)
                        res.json({ text: data })
                    })
            })
        }).catch(err => {
            log.error(`google.controller.getSettings: ${err.message}`, req)
            res.json({ error: err.message })
        })
}

export function saveFile(req: Request, res: Response): void {
    if (!assertGoogleUser(req.user)) {
        return void res.sendStatus(401)
    }

    let filename: string = req.params.name
    let clientData: ClientFileData = req.body

    if (!filename || !clientData) {
        log.error(`google.controller.saveFile: incomplete request: missing filename or request body`, req)
        return void res.sendStatus(400)
    }

    googleDrive.getAccessToken(req.user)
        .then(accessToken => {
            log.debug(`google.controller.saveFile: checking if file exists: ${filename}`, req)

            return googleDrive.get(accessToken, {
                qs: {
                    spaces: 'drive',
                    q: `name='${filename}' and trashed=false`,
                    orderBy: 'modifiedTime desc'
                }
            }).then((fileList: GoogleDriveV3FileList) => {
                assertKind(fileList, KIND_FILE_LIST, 'saveFile')

                if (fileList.files.length === 0) {
                    log.debug(`google.controller.saveFile: file doesn't exist - attempting to create`, req)
                    return createDataFolderIfNotExists(accessToken)
                        .then((parent: GoogleDriveV3File) => {
                            assertKind(parent, KIND_FILE, 'saveFile')
                            return createFile(accessToken, filename, parent.id, clientData)
                                .then((resource: GoogleDriveV3File) => {
                                    assertKind(resource, KIND_FILE, 'saveFile')
                                    log.debug(`google.controller.saveFile: file created`, req)
                                    res.json(resource)
                                })
                        })
                } else {
                    log.debug(`google.controller.saveFile: file exists - attempting to update`, req)
                    return updateFile(accessToken, fileList.files[0].id, clientData)
                        .then((resource: GoogleDriveV3File) => {
                            assertKind(resource, KIND_FILE, 'saveFile')
                            log.debug(`google.controller.saveFile: file updated`, req)
                            res.json(resource)
                        })
                }
            })
        }).catch((err: any) => {
            log.error(`google.controller.saveFile: error: ${err.message}`)
            res.sendStatus(500)
        })
}

export function saveSettings(req: Request, res: Response): void {
    if (!assertGoogleUser(req.user)) {
        return void res.sendStatus(401)
    }

    let clientData: ClientFileData = req.body

    if (!clientData) {
        log.error(`google.controller.saveSettings: incomplete request: missing filename or request body`, req)
        return void res.sendStatus(400)
    }

    googleDrive.getAccessToken(req.user)
        .then(accessToken => {
            log.debug(`google.controller.saveSettings: checking if file exists: ${APP_SETTINGS_FILE}`, req)

            return googleDrive.get(accessToken, {
                qs: {
                    spaces: APP_DATA_FOLDER,
                    q: `name='${APP_SETTINGS_FILE}' and trashed=false`,
                    orderBy: 'modifiedTime desc'
                }
            }).then((fileList: GoogleDriveV3FileList) => {
                assertKind(fileList, KIND_FILE_LIST, 'saveSettings')

                if (fileList.files.length === 0) {
                    log.debug(`google.controller.saveSettings: file doesn't exist - attempting to create`, req)
                    return createFile(accessToken, APP_SETTINGS_FILE, APP_DATA_FOLDER, clientData)
                        .then((resource: GoogleDriveV3File) => {
                            assertKind(resource, KIND_FILE, 'saveSettings')
                            log.debug(`google.controller.saveSettings: file created`)
                            res.json(resource)
                        })
                } else {
                    log.debug(`google.controller.saveSettings: file exists - attempting to update`, req)
                    return updateFile(accessToken, fileList.files[0].id, clientData)
                        .then((resource: GoogleDriveV3File) => {
                            assertKind(resource, KIND_FILE, 'saveFile')
                            log.debug(`google.controller.saveSettings: file updated`)
                            res.json(resource)
                        })
                }
            })
        }).catch(err => {
            log.error(`google.controller.saveSettings: error: ${err.message}`, req)
            res.sendStatus(500)
        })
}

function createFile(accessToken: string, filename: string, parentId: string, clientData: ClientFileData): Promise<GoogleDriveV3File> {
    return googleDrive.post(accessToken, {
        qs: {
            uploadType: 'multipart'
        },
        multipart: [
            {
                'content-type': 'application/json; charset=UTF-8',
                body: JSON.stringify({
                    name: filename,
                    parents: [parentId],
                    modifiedTime: new Date(clientData.lastModified).toISOString()
                })
            },
            {
                'content-type': 'text/plain; charset=UTF-8',
                body: clientData.text
            }
        ]
    }, 'upload')
}

function updateFile(accessToken: string, fileId: string, clientData: ClientFileData): Promise<GoogleDriveV3File> {
    return googleDrive.patch(accessToken, fileId, {
        qs: {
            uploadType: 'multipart'
        },
        multipart: [
            {
                'content-type': 'application/json; charset=UTF-8',
                body: JSON.stringify({
                    modifiedTime: new Date(clientData.lastModified).toISOString()
                })
            },
            {
                'content-type': 'text/plain; charset=UTF-8',
                body: clientData.text
            }
        ]
    })
}

function createDataFolderIfNotExists(accessToken: string): Promise<GoogleDriveV3File> {
    log.debug(`google.controller.createDataFolderIfNotExists: attempting to get app folder fileResource`)

    return getFolderResource(accessToken, DATA_FOLDER_NAME)
        .then((fileList: GoogleDriveV3FileList) => {
            assertKind(fileList, KIND_FILE_LIST, 'createDataFolderIfNotExists')
            if (fileList.files.length === 1) {
                log.debug(`google.controller.createDataFolderIfNotExists: received app folder fileResource`)
                return fileList.files[0]
            }
            log.debug(`google.controller.createDataFolderIfNotExists: app folder doesn't exist, attempting to create`)
            return googleDrive.post(accessToken, {
                json: true,
                body: {
                    mimeType: 'application/vnd.google-apps.folder',
                    name: DATA_FOLDER_NAME
                }
            })
        })
}

function getFolderResource(accessToken: string, folderName: string): Promise<GoogleDriveV3FileList> {
    let qs: any = folderName === APP_DATA_FOLDER
        ? {
            spaces: APP_DATA_FOLDER
        } : {
            spaces: 'drive',
            q: `name='${folderName}'`
        }
    return googleDrive.get(accessToken, { qs })
}

function assertGoogleUser(user: any): boolean {
    if (user && user.provider === 'google') {
        return true
    }
    log.error(`google.controller.getFile: user is not an authorised Google user`)
    return false
}

function assertKind(resource: any, expectedKind: string, functionName: string): void {
    if (resource.kind !== expectedKind) {
        throw new Error(`google.controller.${functionName}: expected '${expectedKind}' but got '${resource.kind}'`)
    }
}
