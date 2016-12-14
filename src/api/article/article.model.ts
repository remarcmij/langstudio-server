'use strict'
import * as mg from 'mongoose'

const ArticleSchema = new mg.Schema({
    fileName: {type: String, required: true, index: true},
    groupName: {type: String, required: true},
    title: {type: String, required: true},
    mdText: String,
    htmlText: String,
    indexText: String,
    style: String,
    _topic: {type: mg.Schema.Types.ObjectId, index: true, ref: 'Topic'}
})

ArticleSchema.index({indexText: 'text'}, {default_language: 'none'})

export interface Article {
    fileName: string
    groupName: string
    title: string
    mdText: string
    htmlText?: string
    indexText?: string,
    hashTags?: any[],
    _topic?: any
}

export interface ArticleDocument extends mg.Document, Article {

}

export const ArticleModel = mg.model<ArticleDocument>('Article', ArticleSchema)
