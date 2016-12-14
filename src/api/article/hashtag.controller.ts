'use strict'
import * as PubSub from 'pubsub-js'
import * as _ from 'lodash'
import {Request, Response} from 'express'

import {HashTagModel, HashTag} from './hashtag.model'
import {TopicModel, Topic} from '../topic/topic.model'
import * as log from '../../services/log.service'
import * as auth from '../../auth/auth.service'
import * as AppConstants from '../../config/app.constants'

interface HashTagItem {
    title: string
    subtitle?: string
    pubTitle: string
    publication: string
    chapter: string
}

interface HashTagName {
    name: string
    count: number
}

interface HashTagGroup {
    _id: string
    tags: HashTagName[]
}

let cachedIndexTopics: Topic[] = []

PubSub.subscribe(AppConstants.INVALIDATE_CACHES, () => {
    log.debug('hashtag.controller: invalidating caches')
    cachedIndexTopics = []
})

export function searchHashTags(req: Request, res: Response): void {
    let name = req.query.q && <string>req.query.q.trim()
    if (!name) {
        return void res.sendStatus(400)
    }

    let indexTopicsPromise = cachedIndexTopics.length !== 0
        ? Promise.resolve(cachedIndexTopics)
        : TopicModel.find({type: 'article', chapter: 'index'}).lean().exec()
        .then((topics: Topic[]) => {
            cachedIndexTopics = topics
            log.debug('hashtag.controller: caching indexTopics')
            return topics
        })

    let criterion: any = {name}
    let groups = auth.getAuthorizedGroups(req)
    if (groups) {
        criterion.groupName = {$in: groups}
    }

    indexTopicsPromise
        .then((topics: Topic[]) => {
            return HashTagModel.find(criterion)
                .populate('_topic')
                .lean()
                .exec()
                .then((hashTags: HashTag[]) => {
                    return hashTags.map(hashTag => {
                        return {
                            title: hashTag._topic.title,
                            subtitle: hashTag.subtitle,
                            pubTitle: _.find(topics, (topic => topic.publication === hashTag._topic.publication)).title || '??',
                            publication: hashTag._topic.publication,
                            chapter: hashTag._topic.chapter
                        }
                    })

                })
        })
        .then((items: HashTagItem[]) => {
            items = _.sortBy(items, item => `${item.pubTitle}.${item.title}`.toLowerCase())
            res.json(items)
        })
        .catch((err: any) => {
            res.status(500).send(err)

        })

}

export function getAllHashTags(req: Request, res: Response): void {
    let criterion: any = {}
    let groups = auth.getAuthorizedGroups(req)
    if (groups) {
        criterion.groupName = {$in: groups}
    }

    HashTagModel.aggregate([
        {
            $match: criterion
        }, {
            $group: {
                _id: '$name',
                count: {
                    $sum: 1
                }
            }
        }, {
            $group: {
                _id: {
                    $toUpper: {
                        $substr: ['$_id', 0, 1]
                    }
                }, tags: {
                    $push: {
                        name: '$_id', count: '$count'
                    }
                }
            },
        }, {
            $sort: {
                _id: 1
            }
        }]).exec()
        .then((tagGroups: HashTagGroup[]) => {
            tagGroups.forEach(group => {
                group.tags = _.sortBy(group.tags, tag => tag.name)
            })
            res.json(tagGroups)
        }, (err: any) => {
            res.status(500).send(err)
        })
}
