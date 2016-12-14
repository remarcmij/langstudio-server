'use strict'
import {Schema, Document} from 'mongoose'
import * as mongoose from 'mongoose'
import * as crypto from 'crypto'

const authTypes = ['twitter', 'facebook', 'google']

const UserSchema = new Schema({
    name: String,
    email: {type: String, lowercase: true},
    role: {
        type: String,
        'default': 'user',
        'enum': ['user', 'admin']
    },
    created: Date,
    lastAccessed: Date,
    disabled: Boolean,
    groups: [String],
    provider: String,
    hashedPassword: String,
    salt: String,
    refreshToken: String,
    facebook: {},
    twitter: {},
    google: {
        id: String,
        image: {
            url: String
        }
    },
    googleExtra: {},
    settings: {}
})

/**
 * Virtuals
 */
UserSchema
    .virtual('password')
    .set(function (password: string) {
        this._password = password
        this.salt = this.makeSalt()
        this.hashedPassword = this.encryptPassword(password)
    })
    .get(function () {
        return this._password
    })

// Public profile information
UserSchema
    .virtual('profile')
    .get(function () {
        return {
            'name': this.name,
            'role': this.role
        }
    })

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function () {
        return {
            '_id': this._id,
            'role': this.role
        }
    })

UserSchema
    .virtual('handle')
    .get(function () {
        return this.email || 'anonymous'
    })

/**
 * Validations
 */

// Validate empty email
UserSchema
    .path('email')
    .validate(function (email: string) {
        return email.length
    }, 'Email cannot be blank')

// Validate empty password
UserSchema
    .path('hashedPassword')
    .validate(function (hashedPassword: string) {
        return hashedPassword.length
    }, 'Password cannot be blank')

// Validate email is not taken
// UserSchema
//     .path('email')
//     .validate(function (value, respond) {
//         var self = this
//         this.constructor.findOne({ email: value }, function (err, user) {
//             if (err) throw err
//             if (user) {
//                 if (self.id === user.id) return respond(true)
//                 return respond(false)
//             }
//             respond(true)
//         })
//     }, 'The specified email address is already in use.')

function validatePresenceOf(value: string) {
    return value && value.length
}

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function (next) {
        if (!this.isNew) return next()

        if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
            next(new Error('Invalid password'))
        else
            next()
    })

/**
 * Methods
 */

interface AuthenticateFunc {
    (plainText: string): boolean
}

interface MakeSaltFunc {
    (): string
}

interface EncryptPasswordFunc {
    (password: string): string
}

interface UserSchemaMethods {
    authenticate: AuthenticateFunc
    makeSalt: MakeSaltFunc
    encryptPassword: EncryptPasswordFunc
}


UserSchema.methods = <UserSchemaMethods>{
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function (plainText: string): boolean {
        return this.encryptPassword(plainText) === this.hashedPassword
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function (): string {
        return crypto.randomBytes(16).toString('base64')
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function (password: string): string {
        if (!password || !this.salt) return ''
        let salt = new Buffer(this.salt, 'base64')
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1')
            .toString('base64')
    }
}

export interface UserData {
    name: string,
    email: string
    role: string,
    created: Date,
    lastAccessed: Date,
    disabled: boolean,
    groups: Array<string>,
    hashedPassword: string,
    salt: string,
    provider: string,
    refreshToken: string,
    facebook: {},
    twitter: {},
    google: {
        id: string,
        image: {
            url: string
        }
    },
    googleExtra: {},
    settings: {},

    // virtual properties
    handle: string
}

export interface UserDocument extends Document, UserData, UserSchemaMethods {

}

export const UserModel = mongoose.model<UserDocument>('User', UserSchema)
