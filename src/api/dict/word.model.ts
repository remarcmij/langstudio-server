'use strict';
import * as mg from 'mongoose'

const WordSchema = new mg.Schema({
    word: { type: String, required: true, index: true },
    lang: { type: String, required: true },
});

export interface WordData {
    word: string;
    lang: string;
}

export interface WordDocument extends mg.Document, WordData {

}

export const WordModel = mg.model<WordDocument>('Word', WordSchema);
