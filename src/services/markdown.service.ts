'use strict'
import {XRegExp} from 'xregexp'
const marked = require('marked')

const foreignFragmentRegExp = /\*{1,2}.+?\*{1,2}/g
const foreignWordRegExp = XRegExp(String.raw `([-'()\p{L}]{2,})|(<.+?>)`, 'g')

export function convertMarkdown(text: string, allForeign?: boolean): string {
    let markup = allForeign ? text : markupFragments(text)

    let html = marked(markup, {
        breaks: true,
        smartypants: false
    })

    return html.replace(/<table>/gm, '<table class=\'table\'>')
}

function markupFragments(text: string): string {
    let buffer = ''
    let start = 0
    foreignFragmentRegExp.lastIndex = 0
    let match = foreignFragmentRegExp.exec(text)
    let fragment: string

    while (match) {
        fragment = match[0]
        let end = foreignFragmentRegExp.lastIndex - fragment.length
        buffer = buffer.concat(text.slice(start, end))
        start = foreignFragmentRegExp.lastIndex
        buffer += markupFragment(fragment)
        match = foreignFragmentRegExp.exec(text)
    }

    buffer += text.slice(start)
    return buffer
}

function markupFragment(text: string): string {
    let buffer = ''

    let start = 0
    foreignWordRegExp.lastIndex = 0
    let match = foreignWordRegExp.exec(text)

    while (match) {
        let replacement: string
        if (match[1]) {
            replacement = `<span>${match[1]}</span>`
        } else {
            replacement = match[2]
        }
        let end = foreignWordRegExp.lastIndex - match[0].length
        buffer += text.slice(start, end)
        start = foreignWordRegExp.lastIndex
        buffer += replacement
        match = foreignWordRegExp.exec(text)
    }

    buffer += text.slice(start)
    return buffer
}
