'use strict'
const md5 = require('md5')

export interface TopicHashData {
    fileName: string
    publication: string
    chapter: string
    part?: string
    groupName: string
    sortIndex: number
    title: string
    subtitle?: string
    author?: string
    copyright?: string
    publisher?: string
    pubDate?: string
    mdText?: string
}

export function hashTopic(hashData: TopicHashData) {
    return md5(JSON.stringify(hashData))
}