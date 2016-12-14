'use strict'

import { Request, Response } from 'express'
import * as _ from 'lodash'
import { XRegExp } from 'xregexp'

import { Article, ArticleModel } from './article.model'
import * as log from '../../services/log.service'
import * as lm from '../../services/language.service'
import * as mds from '../../services/markdown.service'

const validHighlightFraseRegExp = XRegExp("^[-\\s'()\\p{L}.?!]+$")
const contentMarkerRegExp = /<!-- flashcard -->|<!-- translate-start -->/

const publicGroups = ['public']

export function getArticle(req: Request, res: Response): void {

    ArticleModel.findOne({ fileName: req.params.filename })
        .select('-indexText')
        .lean()
        .then((article: Article) => {
            let highlightPhrase: string = req.query.q

            if (highlightPhrase) {
                // convert as a once-off including highlighting
                let highlightText = highlightSearchText(article.mdText, highlightPhrase)
                article.htmlText = mds.convertMarkdown(highlightText, true)
            }

            // no need to send original text if it doesn't data
            // required by the client
            if (!contentMarkerRegExp.test(article.mdText)) {
                article.mdText = ''
            }

            log.info(`fetched article ${article.fileName}`, req)

            sendIfAuthorized(req, res, article)

        })
        .catch((err: any) => {
            log.error(`get article error ${err.message}`, req)
            res.status(500).send(err.message)
        })
}

function highlightSearchText(htmlIn: string, phrase: string): string {

    let isPhrase = /^".+"$/.test(phrase)

    // remove any enclosing quotes
    phrase = phrase.replace(/^"(.+?)"$/, '$1')

    // return input "as is" if highlight phrase is interspersed within
    // with special characters

    if (!validHighlightFraseRegExp.test(phrase)) {
        return htmlIn
    }

    let terms = isPhrase ? [phrase] : phrase.split(' ')

    let htmlOut = htmlIn

    for (let term of terms) {

        // note: use negative look-ahead to prevent highlighting text
        // within an HTML anchor id
        let pattern = isPhrase ? term : lm.makePattern(term)
        let regexp = new RegExp(String.raw`\b(_*${pattern}_*)\b`, 'gi')
        let index = 0
        let startpos = 0
        let endpos: number
        let fragment: string
        htmlOut = ''

        let match = regexp.exec(htmlIn)
        while (match) {
            fragment = match[0]
            endpos = regexp.lastIndex - fragment.length
            htmlOut += htmlIn.slice(startpos, endpos)
            startpos = regexp.lastIndex
            index += 1
            htmlOut += `<a id="highlight-${index}"><span class="hr-highlight hr-highlight-on">${match[1]}</span></a>`
            match = regexp.exec(htmlIn)
        }
        htmlOut += htmlIn.slice(startpos)
        htmlIn = htmlOut
    }

    return htmlOut
}

function sendIfAuthorized(req: Request, res: Response, articleData: Article): void {
    let groups: string[]
    let isAdmin = false

    if (req.user) {
        groups = req.user.groups.concat(['public'])
        if (req.user.role === 'admin') {
            isAdmin = true
        }
    } else {
        groups = publicGroups
    }

    if (isAdmin || groups.indexOf(articleData.groupName) !== -1) {
        // allow browser to cache for a year (with cache busting in place)
        (<any>res).append('Cache-Control', 'private, max-age=31536000')
        res.json(articleData)
    } else {
        log.warn(`access denied: ${articleData.fileName}`, req)
        res.sendStatus(401)
    }
}

export function searchArticles(req: Request, res: Response): void {

    let phrase = <string>req.query.q.trim()
    if (!phrase.startsWith('"')) {
        phrase = phrase.replace(/([-'\w]+)/g, '"$1"')
    }

    let condition: any = {
        $text: {
            $search: phrase
        }
    }

    let groups = getGroups(req.user)

    if (groups) {
        condition.groupName = { $in: groups }
    }

    Promise.resolve(ArticleModel
        .find(condition, { _topic: 1 })
        .populate('_topic')
        .lean())
        .then(docs => {
            res.json(docs)
        })
        .catch(err => {
            res.sendStatus(500)
        })
}

function getGroups(user: any): Array<string> {
    let groups: Array<string> = []

    if (user) {
        if (user.role !== 'admin') {
            groups = user.groups
            groups = _.uniq(groups.concat(publicGroups))
        }
    } else {
        groups = publicGroups
    }

    return groups
}
