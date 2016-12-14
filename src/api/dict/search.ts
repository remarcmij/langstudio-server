'use strict'
import {Request, Response} from 'express'
import * as _ from 'lodash'
import * as LRU from 'lru-cache'
import {XRegExp} from 'xregexp'

import {LemmaModel, Lemma} from './lemma.model'
import {WordModel} from './word.model'
import * as log from '../..//services/log.service'

interface AutoCompleteItem {
    word: string
    lang: string
}

interface AutoCompleteResponse {
    searchText: string
    items: Array<AutoCompleteItem>
}

interface SearchRequest {
    word: string
    lang: string
    attr: string
    chunk?: number
    groups?: Array<string>
}

const VALID_AUTOCOMPLETE_TEXT = XRegExp('^[-\'()\\p{L}]+$')
const CHUNK_SIZE = 50

const autoCompleteCache = LRU<AutoCompleteResponse>({
    max: 500,
    maxAge: 1000 * 60 * 60
})

interface SearchFunction {
    (result: Lemma[]): Lemma[] | Promise<Lemma[]>
}

export function dictSearch(req: Request, res: Response): void {
    let words: string[] = req.params.word.split(',')
    let groups: string[]

    if (req.user) {
        if (req.user.role !== 'admin') {
            groups = req.user.groups
        }
    } else {
        groups = ['public']
    }

    // todo: delete/disable next line to properly check groups
    // groups = ['teeuw', 'vandale']

    let searchFunctions: SearchFunction[]
    searchFunctions = words.map(word => {
        return (docs: Lemma[]) => {
            // return the result if something found from
            // previous promise
            if (docs && docs.length !== 0) {
                return docs
            }
            // return promise for next iteration
            let searchRequest: SearchRequest = {
                word: word,
                attr: req.params.attr,
                chunk: parseInt(req.params.chunk || '0', 10),
                lang: req.query.lang,
                groups: groups
            }
            return doSearch(searchRequest)
        }
    })

    let lookupPromise = Promise.resolve<Lemma[]>([])

    searchFunctions.forEach(lookupFunction => {
        lookupPromise = lookupPromise.then(lookupFunction)
    })

    let lookupResults: Array<Lemma[]> = []

    // handle result of final promise
    lookupPromise
        .then((docs: Lemma[]) => {
            let haveMore = docs.length === CHUNK_SIZE
            let lemmas = _.uniqBy(docs, doc => doc.text)
            res.json({lemmas, haveMore})
        })
        .catch(err => {
            log.error(`search: '${req.params.word}', error: ${err.message}`, req)
            res.status(500).send(err.message)
        })
}

function doSearch(sr: SearchRequest): Promise<Lemma[]> {

    let condition: any = {
        word: sr.word,
    }

    if (sr.attr === 'k') {
        condition.attr = 'k'
    }

    if (sr.lang) {
        condition.lang = sr.lang
    }

    if (sr.groups) {
        condition.groupName = {$in: sr.groups}
    }

    if (sr.chunk === -1) {
        return Promise.resolve(LemmaModel
            .find(condition)
            .sort('word order')
            .lean())
    } else {
        return Promise.resolve(LemmaModel
            .find(condition)
            .sort('word order')
            .skip(CHUNK_SIZE * sr.chunk)
            .limit(CHUNK_SIZE)
            .lean())
    }
}

export function autoCompleteSearch(req: Request, res: Response): void {
    let searchText: string = req.params.text.trim()
    let result: AutoCompleteResponse = {
        searchText: searchText,
        items: []
    };
    if (searchText.length === 0 || !VALID_AUTOCOMPLETE_TEXT.test(searchText)) {
        return void res.json([])
    }

    let cachedResult = autoCompleteCache.get(searchText)

    if (cachedResult) {
        log.silly(`cache hit for '${searchText}'`)
        res.json(cachedResult.items)
    } else {
        WordModel.find({word: {$regex: '^' + searchText}})
            .select('-_id')
            .limit(10).lean()
            .then((items: AutoCompleteItem[]) => {
                let result = {searchText, items}
                autoCompleteCache.set(searchText, result)
                log.silly(`cache store for '${searchText}'`)
                res.json(items)
            })
    }
}

export function clearAutoCompleteCache(): void {
    autoCompleteCache.reset()
}
