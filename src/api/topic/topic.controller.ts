'use strict'
import * as _ from 'lodash'
import { Request, Response } from 'express'

import {TopicModel, Topic} from './topic.model'
import * as log from '../../services/log.service'
import {UserData} from "../user/user.model";

const publicGroups = ['public']

interface Group {
    name: string
    publications: Set<string>
}

interface PublicationGroup {
    name: string
    publications: string
    checked?: boolean
}

export function getCollection(req: Request, res: Response): void {

    getIndexTopics(req.user)
        .then(topics => {
            log.debug(`fetched collection`, req)
            res.json(topics)
        }, err => {
            log.error(`get collection error ${err.message}`, req)
            res.status(500).send(err)
        })
}

export function getIndexTopics(user: UserData): Promise<Topic[]> {
    let criterion: any = {
        type: 'article',
        chapter: 'index'
    }

    let groups = getAuthorizedGroups(user)

    if (groups) {
        criterion.groupName = { $in: groups }
    }

    return TopicModel.find(criterion)
        .sort('publication')
        .lean().exec()

}

export function getPublication(req: Request, res: Response): void {
    let publication = req.params.pub
    let criterion: any = { type: 'article', publication }
    let groups = getAuthorizedGroups(req.user)

    if (groups) {
        criterion.groupName = { $in: groups }
    }

    TopicModel.find(criterion)
        .sort('sortIndex part title')
        .lean()
        .then((topics: Topic[]) => {
            if (topics.length === 0) {
                // no matching group or publication not found.
                // treat as 'unauthorized' http error
                res.sendStatus(401)
            } else {
                log.debug(`fetched publication ${publication} (${topics.length} topics)`, req)
                res.json(topics)
            }
        }, err => {
            log.error(`get publication ${publication} error ${err.message}`, req)
            res.status(500).send(err)
        })
}

function getAuthorizedGroups(user: any): Array<string> | null {
    let groups: Array<string> = []

    if (user) {
        if (user.role === 'admin') {
            return null
        }
        groups = user.groups
        groups = _.uniq(groups.concat(publicGroups))
    } else {
        groups = publicGroups
    }

    return groups
}

export function getAdminTopics(req: Request, res: Response): void {
    TopicModel.find({})
        .sort('publication sortIndex title')
        .lean()
        .then(topics => {
            log.debug('fetched admin topics', req)
            res.json(topics)
        }, err => {
            log.error(`get admin topics error ${err.message}`, req)
            res.status(500).send(err)
        })
}

export function getAppTopics(req: Request, res: Response): void {
    let criterion: any = {
        type: 'article'
    }

    let groups = getAuthorizedGroups(req.user)

    if (groups) {
        groups = groups.filter(groupName => groupName != "public")
        criterion.groupName = { $in: groups }
    }

    TopicModel.find(criterion)
        .sort('publication')
        .lean()
        .then((topics: Topic[]) => {
            log.debug(`fetched app topics (${topics.length})`, req)
            res.json(topics)
        }, err => {
            log.error(`get app topics error ${err.message}`, req)
            res.status(500).send(err)
        })
}

export function getGroupInfo(req: Request, res: Response): void {
    TopicModel.find({})
        .sort('groupName')
        .lean()
        .then((topics: Topic[]) => {
            let groupMap = new Map<string, Group>()

            topics.forEach(topic => {
                let group = groupMap.get(topic.groupName)
                if (!group) {
                    group = {
                        name: topic.groupName,
                        publications: new Set<string>()
                    }
                    groupMap.set(topic.groupName, group)
                }
                if (topic.publication) {
                    group.publications.add(topic.publication)
                }
            })

            let groups: PublicationGroup[] = []

            groupMap.forEach((group, name) => {
                let items: string[] = []
                group.publications.forEach((pubtitle: string) => {
                    items.push(pubtitle)
                })
                groups.push({
                    name: name,
                    publications: items.join(', ')
                })
            })

            log.debug('fetched group info', req)
            res.json(groups)

        }, err => {
            log.error(`get group info error ${err.message}`, req)
            res.status(500).send(err)
        })
}
