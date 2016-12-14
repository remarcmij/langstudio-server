'use strict'

import * as mg from 'mongoose'
import * as _ from 'lodash'
import * as multiparty from 'multiparty'
import * as fs from 'fs'
import * as path from 'path'
import {Request, Response} from 'express'
import * as PubSub from 'pubsub-js'

import {TopicModel, TopicDocument, Topic} from './topic.model'
import * as articleLoader from '../article/article-loader'
import * as dictLoader from '../dict/dict-loader'
import * as log from '../../services/log.service'
import {TaskQueue} from '../../components/utils/taskqueue'
import * as AppConstants from '../../config/app.constants'

export interface UploadData<T> {
    topic: Topic
    payload: T
}

const CONCURRENCY = 2

let taskQueue: TaskQueue<void> = new TaskQueue<void>(CONCURRENCY)

// definitely-typed definition file contains incorrect casing for originalFilename
interface IMultipartyFile {
    /**
     * same as name - the field name for this file
     */
    fieldName: string
    /**
     * the filename that the user reports for the file
     */
    originalFilename: string
    /**
     * the absolute path of the uploaded file on disk
     */
    path: string
    /**
     * the HTTP headers that were sent along with this file
     */
    headers: any
    /**
     * size of the file in bytes
     */
    size: number
}

interface ICreateDataFunction {
    (doc: mg.Document, data: UploadData<any>): Promise<number>
}

interface IParseFileFunction {
    (content: string, fileName: string): UploadData<any>
}

interface IRemoveDataFunction {
    (doc: mg.Document): Promise<void>
}

interface ILoader {
    createData: ICreateDataFunction
    removeData: IRemoveDataFunction
    parseFile: IParseFileFunction
}

function getLoader(originalFilename: string): ILoader {

    if (/\.dict\.json$/.test(originalFilename)) {
        return dictLoader
    }

    if (/\.md$/.test(originalFilename)) {
        return articleLoader
    }

    throw new Error('unsupported file extension')
}

function updateTopic(data: UploadData<any>): Promise<TopicDocument> {

    return Promise.resolve(TopicModel.findOne({fileName: data.topic.fileName}).exec())
        .then(topic => {
            // create a new Topic if no existing one found
            if (topic) {
                topic.groupName = 'public'
                topic.foreignLang = undefined
                topic.baseLang = undefined
                topic.part = undefined
                topic.title = undefined
                topic.sortIndex = undefined
                topic.subtitle = undefined
                topic.author = undefined
                topic.copyright = undefined
                topic.publisher = undefined
                topic.pubDate = undefined
                topic.isbn = undefined
                topic.hash = undefined
            } else {
                topic = new TopicModel()
            }

            _.assign(topic, data.topic)

            topic.lastModified = Date.now()

            return new Promise((resolve, reject) => {
                topic.save((err: any, savedTopic: TopicDocument) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(savedTopic)
                    }
                })
            })
        })
}

function createData(loader: ILoader, topic: any, data: UploadData<any>): Promise<void> {
    return loader.createData(topic, data)
}

function importFile(filePath: string, originalFilename: string): Promise<void> {

    return new Promise<string>((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, content) => {
            if (err) {
                reject(err)
            } else {
                resolve(content)
            }
        })
    }).then(content => {
        let loader = getLoader(originalFilename)
        let uploadData = loader.parseFile(content, originalFilename)

        return TopicModel.findOne({fileName: originalFilename})
            .then((topic: TopicDocument) => loader.removeData(topic))
            .then(() => updateTopic(uploadData))
            .then((updatedTopic: TopicDocument) => createData(loader, updatedTopic, uploadData))

    })

}

export function removeTopic(req: Request, res: Response): void {
    let fileName: string = req.params.filename

    Promise.resolve(TopicModel.findOne({fileName}).exec())
        .then(topic => {
            let loader: ILoader = topic.type === 'dict' ? dictLoader : articleLoader

            return loader.removeData(topic)
                .then(() => {
                    return Promise.resolve(TopicModel.remove({_id: topic._id}).exec())
                })
                .then(() => {
                    res.status(200).end()
                })
        })
        .catch(err => {
            res.status(404).send(err.message)
        })
}

export function uploadFile(req: Request, res: Response): void {
    new Promise<IMultipartyFile>((resolve, reject) => {
        let uploadDir = path.join(__dirname, '../../../upload')
        let form = new multiparty.Form({uploadDir: uploadDir, maxFilesSize: 10 * 1024 * 1024})
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err)
            } else {
                resolve(files.file[0])
            }
        })
    }).then(file => {
        taskQueue.pushTask(() => {
            return importFile(file.path, file.originalFilename)
                .then(() => {
                    log.info(`file '${file.originalFilename}' uploaded succesfully`, req)
                    PubSub.publish(AppConstants.INVALIDATE_CACHES, null)
                    res.json({fileName: file.originalFilename})
                })
                .catch(err => {
                    let message: string
                    if (err.name === 'ValidationError') {
                        message = err.toString()
                    } else {
                        message = err.message
                    }
                    log.error(`error uploading file '${file.originalFilename}': ${message}`, req)
                    res.status(400).send(JSON.stringify({
                        fileName: file.originalFilename,
                        message: message
                    }))
                })
                .then(() => {
                    fs.unlink(file.path)
                })
        })
    }).catch(err => {
        let status = err.message.indexOf('maxFilesSize') !== -1 ? 413 : 400
        res.writeHead(status, {'content-type': 'text/plain', connection: 'close'})
        let response = status === 413 ? 'Request Entity Too Large' : 'Bad Request'
        res.end(response)

    })
}
