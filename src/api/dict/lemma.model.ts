'use strict'
import * as mg from 'mongoose'

const LemmaSchema = new mg.Schema({
    word: {type: String, required: true},
    lang: {type: String, required: true},
    baseWord: {type: String, required: true},
    baseLang: {type: String, required: true},
    order: {type: Number, required: true},
    homonym: {type: Number, required: true},
    attr: {type: String, required: true},
    text: {type: String, required: true},
    groupName: {type: String, required: true},
    _topic: {type: mg.Schema.Types.ObjectId, required: true, ref: 'Topic'}
})

LemmaSchema.index({word: 1, order: 1})

export interface Lemma {
    word: string
    lang: string
    attr: string
    baseWord: string
    baseLang: string
    text: string
    order: number
    homonym: number
    groupName: string
}

export interface LemmaEx extends Lemma {
    _lemma?: mg.Types.ObjectId
    _topic?: mg.Types.ObjectId
}

export interface LemmaDocument extends mg.Document, LemmaEx {

}

export const LemmaModel = mg.model<LemmaDocument>('Lemma', LemmaSchema)
