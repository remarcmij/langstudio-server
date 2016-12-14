/**
 * Created by jimcramer on 01/12/2016.
 */

// Typings reference file, see links for more information
// https://github.com/typings/typings
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

declare module 'md5'

declare module "mongoose" {
    type MongoosePromise<T> = Promise<T>
}
