'use strict'
import * as _ from 'lodash'
import * as md5 from 'md5'

import {TopicDocument, Topic} from '../topic/topic.model'
import {ArticleModel, Article} from './article.model'
import {HashTagModel} from './hashtag.model'
import * as markDownService from '../../services/markdown.service'
import * as headerParser from '../../cli/header-parser'
import {UploadData} from "../topic/upload.controller";

interface TagAndSubtitle {
    tag: string
    subtitle: string
}

export function createData(topic: TopicDocument, data: UploadData<Article>): Promise<{}> {
    let article = data.payload
    article._topic = topic._id

    let indexText = article.mdText

    // strip off header section from index text
    let match = indexText.match(/<\/section>/)
    if (match) {
        indexText = indexText.slice(match.index + match[0].length)
    }

    // remove all html tags from index text
    indexText = indexText.replace(/<.+?>/g, '')
    article.indexText = indexText

    return ArticleModel.create(article)
        .then(() => bulkLoadHashTags(article, topic))
}

function bulkLoadHashTags(article: Article, topic: TopicDocument): Promise<{}> {
    if (article.hashTags!.length === 0) {
        return Promise.resolve({})
    }

    let collection = (HashTagModel as any).collection
    let bulk = collection.initializeUnorderedBulkOp()

    for (let hashTag of article.hashTags!) {
        bulk.insert({
            name: hashTag.tag,
            subtitle: hashTag.subtitle,
            groupName: topic.groupName,
            _topic: topic._id
        })
    }

    return new Promise<{}>((resolve, reject) => {
        bulk.execute((err: any, res: any) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export function removeData(topic: TopicDocument): Promise<void> {
    return topic
        ? ArticleModel.remove({_topic: topic._id}).exec()
        .then(() => HashTagModel.remove({_topic: topic._id}))
        : Promise.resolve()
}

export function parseFile(content: string, fileName: string): UploadData<Article> {

    let match = fileName.match(/(.+)\.(.+)\./)
    if (!match) {
        throw new Error(`ill-formed filename: ${fileName}`)
    }
    let publication = match[1]
    let chapter = match[2]

    let header = headerParser.parseHeader(content)

    let title = header.get('title')

    if (!title) {
        const h1RegExp = /^# *([^#][^\n]+)/m
        match = content.match(h1RegExp)
        if (match) {
            title = match[1]
        }
    }

    let subtitle = header.get('subtitle')

    if (!subtitle && chapter !== 'index') {
        const h2RegExp = /^##\s+(.*)$/gm
        subtitle = ''
        match = h2RegExp.exec(content)

        while (match) {
            if (subtitle.length > 0) {
                subtitle += ' • '
            }
            subtitle += match[1]
            match = h2RegExp.exec(content)
        }
    }

    let topic: Topic = {
        type: 'article',
        fileName: fileName,
        publication: publication,
        chapter: chapter,
        part: header.get('part'),
        foreignLang: header.get("foreign-lang"),
        baseLang: header.get("base-lang"),
        groupName: header.get('group-name') || 'public',
        sortIndex: parseInt(header.get('sort-index') || '0', 10),
        title: title,
        subtitle: subtitle,
        author: header.get('author'),
        copyright: header.get('copyright'),
        publisher: header.get('publisher'),
        pubDate: header.get('pubDate'),
        isbn: header.get('isbn'),
        categories: header.get('categories')
    }

    let article: Article = {
        fileName: fileName,
        groupName: topic.groupName,
        title: topic.title || 'untitled',
        mdText: content
    }

    topic.hash = md5(JSON.stringify({topic, article}))

    article.hashTags = extractHashTags(content)

    // add markup for single word hash tags
    content = content.replace(/#[-'a-zA-Z\u00C0-\u00FF]{2,}/g, '<span class="hashtag">$&</span>')

    // add markup for hash tags enclosed in curly brackets (e.g. multi-word)
    content = content.replace(/#\{(.+?)}/g, '<span class="hashtag">#$1</span>')

    article.htmlText = markDownService.convertMarkdown(content, header.get("foreign-text") === 'true')

    return {
        topic: topic,
        payload: article
    }
}

function extractHashTags2(content: string): string[] {
    let hashTags: string[] = []

    const singleWordHashTagRegExp = /#([-'a-zA-Z\u00C0-\u00FF]{2,})/g
    let match = singleWordHashTagRegExp.exec(content)
    while (match) {
        hashTags.push(match[1].trim().toLowerCase())
        match = singleWordHashTagRegExp.exec(content)
    }

    const bracketedHashTagRegExp = /#\{(.+?)}/g
    match = bracketedHashTagRegExp.exec(content)
    while (match) {
        hashTags.push(match[1].trim().toLowerCase())
        match = bracketedHashTagRegExp.exec(content)
    }

    return _.uniq(hashTags)
}

function extractHashTags(content: string): TagAndSubtitle[] {
    const hashTagRegExp = /#([-'a-zA-Z\u00C0-\u00FF]{2,})|(?:#\{(.+?)})/g

    let results: TagAndSubtitle[] = []
    let lines = content.split('\n')
    let subtitle = ''
    for (let line of lines) {
        line = line.trim()
        if (/^#/.test(line)) {
            subtitle = line.replace(/^#+/, '').trim()
        } else {
            let match = hashTagRegExp.exec(line)
            while (match) {
                let tag = match[1] || match[2]
                tag = tag.trim().toLowerCase()
                results.push({tag, subtitle})
                match = hashTagRegExp.exec(line)
            }
        }
    }

    return results
}
