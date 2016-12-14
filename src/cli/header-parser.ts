'use strict'

const headerStartRegExp = /<!-- header -->/
const headerEndRegExp = /<!-- end-header -->/
const headerDivRegExp = /<!-- +(.*?): +(.*?) +-->/g

export function parseHeader(text: string): Map<string, string> {
    let headerMap = new Map<string, string>()

    let headerBounds = getHeaderBounds(text)
    let headerText = text.substring(headerBounds[0], headerBounds[1])

    headerDivRegExp.lastIndex = 0
    let divMatch = headerDivRegExp.exec(headerText)

    while (divMatch) {
        headerMap.set(divMatch[1], divMatch[2])
        divMatch = headerDivRegExp.exec(headerText)
    }

    return headerMap
}

export function removeHeader(text: string): string {
    let headerBounds = getHeaderBounds(text)
    return text.substring(headerBounds[1])
}

function getHeaderBounds(text: string): [number, number] {
    let startMatch = text.match(headerStartRegExp)
    if (!startMatch) {
        throw new Error("missing header section")
    }
    let startPos = startMatch.index!

    let endMatch = text.match(headerEndRegExp)
    if (!endMatch || endMatch.index < startPos) {
        throw new Error("missing section closing tag")
    }

    let endPos = endMatch.index + endMatch[0].length
    return [startPos, endPos]
}