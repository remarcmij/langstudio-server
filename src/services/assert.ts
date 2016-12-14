'use strict'

module.exports = function (condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}
