'use strict'
import * as mg from 'mongoose'
import * as _ from 'lodash'

import {LemmaModel} from './lemma.model'
import {WordModel} from './word.model'
import * as search from '../dict/search'
import * as log from '../..//services/log.service'
import {TopicDocument} from "../topic/topic.model";
import {UnorderedBulkOperation} from "mongodb";
import {UploadData} from "../topic/upload.controller";

const REBUILD_DELAY = 10000  // 10 secs
const debouncedRebuildWordCollection = _.debounce(rebuildWordCollection, REBUILD_DELAY)

interface DictWordJson {
    word: string
    attr: string
    lang: string
    order: number
}

interface DictLemmaJson {
    base: string
    homonym: number
    text: string
    words: DictWordJson[]
}

interface DictDataJson {
    groupName: string
    baseLang: string
    lemmas: Array<DictLemmaJson>
}

export function createData(topic: mg.Document, uploadData: UploadData<DictDataJson>): Promise<{}> {
    let collection = (LemmaModel as any).collection
    let bulk = collection.initializeUnorderedBulkOp()
    let json = uploadData.payload

    for (let lemmaDef of uploadData.payload.lemmas) {
        for (let wordDef of lemmaDef.words) {
            bulk.insert({
                baseWord: lemmaDef.base,
                homonym: lemmaDef.homonym,
                text: lemmaDef.text,
                word: wordDef.word,
                attr: wordDef.attr,
                order: wordDef.order,
                lang: wordDef.lang,
                baseLang: json.baseLang,
                groupName: uploadData.topic.groupName,
                _topic: topic._id
            })
        }
    }

    return new Promise<{}>((resolve, reject) => {
        bulk.execute((err: any, res: any) => {
            if (err) {
                reject(err)
            } else {
                debouncedRebuildWordCollection()
                resolve()
            }
        })
    })
}

export function removeData(topic: TopicDocument): Promise<void> {
    if (topic) {
        return Promise.resolve(LemmaModel.remove({_topic: topic._id}).exec())
    }
    return Promise.resolve()
}

export function parseFile(content: string, fileName: string): UploadData<DictDataJson> {
    let data: DictDataJson = JSON.parse(content)

    let match = fileName.match(/(.+)\.(.+)\./)
    if (!match) {
        throw new Error(`ill-formed filename: ${fileName}`)
    }

    return {
        topic: {
            fileName: fileName,
            type: 'dict',
            groupName: data.groupName
        },
        payload: data
    }
}

function rebuildWordCollection(): void {
    let collection = (WordModel as any).collection
    WordModel.remove({})
        .then(() => {
            return LemmaModel.distinct('lang')
        })
        .then((languages: Array<string>) => {
            let promises = languages.map(lang => {
                return LemmaModel.distinct('word', {lang})
                    .then(words => {
                        return {lang, words}
                    })
            })
            return Promise.all(promises)
        })
        .then((results: any[]) => {

            search.clearAutoCompleteCache()

            let bulk = collection.initializeUnorderedBulkOp()

            results.forEach(result => result.words.reduce((acc: UnorderedBulkOperation, word: string) => {
                acc.insert({word, lang: result.lang})
                return acc
            }, bulk))

            bulk.execute((err: any) => {
                if (err) {
                    log.error(`auto-complete collection bulk insert error: ${err.message}`)
                } else {
                    log.info(`auto-complete collection rebuilt`)
                }
            })
        })
}

