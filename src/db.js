"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Err = __importStar(require("./error"));
const result_1 = require("./result");
const P = __importStar(require("p-iteration"));
const streamToPromise = require('stream-to-promise');
class DB {
    constructor(_db) {
        this.db = _db;
    }
    async get(key, key_encode = 'hex', val_encode = 'utf8') {
        try {
            const got = await this.db.get(Buffer.from(key, key_encode));
            if (got == null)
                return new result_1.Result(null, new Err.DBError("got null data from database"));
            else
                return new result_1.Result(got.toString(val_encode));
        }
        catch (e) {
            return new result_1.Result(null, new Err.DBError(e));
        }
    }
    async put(key, val, key_encode = 'hex', val_encode = 'utf8') {
        try {
            await this.db.put(Buffer.from(key, key_encode), Buffer.from(val, val_encode));
            return new result_1.Result(1);
        }
        catch (e) {
            return new result_1.Result(0, new Err.DBError(e));
        }
    }
    async del(key, key_encode = 'hex') {
        try {
            await this.db.del(Buffer.from(key, key_encode));
            return new result_1.Result(1);
        }
        catch (e) {
            return new result_1.Result(0, new Err.DBError(e));
        }
    }
    async read_obj(key) {
        try {
            const read = await this.get(key);
            if (read.err)
                return new result_1.Result(null, read.err);
            if (read.ok == null)
                return new result_1.Result(null, new Err.DBError("got null object from database"));
            const parsed = JSON.parse(read.ok);
            return new result_1.Result(parsed);
        }
        catch (e) {
            return new result_1.Result(null, new Err.DBError(e));
        }
    }
    async write_obj(key, obj) {
        try {
            await this.put(key, JSON.stringify(obj));
            return new result_1.Result(1);
        }
        catch (e) {
            return new result_1.Result(0, new Err.DBError(e));
        }
    }
    async filter(key_encode = 'hex', val_encode = 'utf8', check = (key, value) => true) {
        try {
            let result = [];
            const stream = this.db.createReadStream();
            const data_array = await streamToPromise(stream);
            await P.forEach(data_array, async (data) => {
                const key = data.key.toString(key_encode);
                const value = JSON.parse(data.value.toString(val_encode));
                if (await check(key, value))
                    result.push(value);
            });
            return new result_1.Result(result);
        }
        catch (e) {
            return new result_1.Result([], new Err.DBError(e));
        }
    }
}
exports.DB = DB;
