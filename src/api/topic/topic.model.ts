'use strict'
import  * as mg from 'mongoose'

let TopicSchema: mg.Schema = new mg.Schema({
    type: {type: String, required: true, 'enum': ['article', 'dict']},
    fileName: {type: String, required: true, unique: true},
    publication: String,
    chapter: String,
    part: String,
    foreignLang: String,
    baseLang: String,
    groupName: {type: String, required: true},
    sortIndex: {type: Number, 'default': 0},
    title: String,
    subtitle: String,
    author: String,
    copyright: String,
    publisher: String,
    pubdate: String,
    isbn: String,
    categories: String,
    hash: String,
    lastModified: {type: Date, 'default': Date.now()}
})

export interface Topic {
    type: string
    fileName: string
    publication?: string
    chapter?: string
    part?: string
    foreignLang?: string
    baseLang?: string
    groupName: string
    sortIndex?: number
    title?: string
    subtitle?: string
    author?: string
    copyright?: string
    publisher?: string
    pubDate?: string
    isbn?: string
    categories?: string
    hash?: string
    lastModified?: number
    inCollection?: boolean
}

export interface TopicDocument extends mg.Document, Topic {

}

export let TopicModel = mg.model<TopicDocument>('Topic', TopicSchema)
