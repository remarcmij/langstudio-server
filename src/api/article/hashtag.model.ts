'use strict'
import * as mg from 'mongoose'

const HashTagSchema = new mg.Schema({
    name: {type: String, required: true, index: true},
    subtitle: String,
    groupName: {type: String, required: true},
    _topic: {type: mg.Schema.Types.ObjectId, index: true, ref: 'Topic'}
})

export interface HashTag {
    name: string
    subtitle?: string
    groupName: string
    _topic?: any
}

export interface HashTagDocument extends mg.Document, HashTag {

}

export const HashTagModel = mg.model<HashTagDocument>('HashTag', HashTagSchema)
