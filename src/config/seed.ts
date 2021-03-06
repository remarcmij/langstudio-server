'use strict'
import {UserModel} from '../api/user/user.model'

const adminEmail = 'admin@taalmap.nl'
const demoUserEmail = 'demo@taalmap.nl'

UserModel.findOne({email: adminEmail}, (err, user) => {
    if (err) {
        console.error(err)
    } else if (!user) {
        let now = new Date()
        UserModel.create({
            provider: 'local',
            role: 'admin',
            name: 'Admin',
            email: adminEmail,
            password: process.env.ADMIN_PASSWORD,
            created: now,
            lastAccessed: now
        }, () => {
            console.log('created admin account')
        })
    }
})

UserModel.findOne({email: demoUserEmail}, (err, user) => {
    if (err) {
        console.error(err)
    } else if (!user) {
        let now = new Date()
        UserModel.create({
            provider: 'local',
            role: 'user',
            name: 'Demo user',
            email: demoUserEmail,
            password: process.env.DEMO_PASSWORD,
            created: now,
            lastAccessed: now
        }, () => {
            console.log('created demo account')
        })
    }
})
