"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const levelup_1 = __importDefault(require("levelup"));
const leveldown_1 = __importDefault(require("leveldown"));
class DB {
    constructor(root) {
        this.db = levelup_1.default(leveldown_1.default(root));
    }
    async get(key, key_encode = 'hex', val_encode = 'utf8') {
        try {
            const buffer = await this.db.get(Buffer.from(key, key_encode));
            return buffer.toString(val_encode);
        }
        catch (e) {
            return null;
        }
    }
    async put(key, val, key_encode = 'hex', val_encode = 'utf8') {
        await this.db.put(Buffer.from(key, key_encode), Buffer.from(val, val_encode));
    }
    async del(key) {
        await this.db.del(key);
    }
    async read_obj(key) {
        const read = await this.get(key);
        if (read == null)
            return null;
        return JSON.parse(read);
    }
    async write_obj(key, obj) {
        await this.put(key, JSON.stringify(obj));
    }
    async filter(key_encode = 'hex', val_encode = 'utf8', check = (key, value) => true) {
        let result = [];
        const stream = this.db.createReadStream();
        return new Promise((resolve, reject) => {
            try {
                stream.on('data', async (data) => {
                    if (data.key == null || data.value == null)
                        return result;
                    const key = data.key.toString(key_encode);
                    const value = JSON.parse(data.value.toString(val_encode));
                    if (await check(key, value))
                        result.push(value);
                });
                stream.on('end', (data) => {
                    resolve(result);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    leveldb() {
        return this.db;
    }
}
exports.DB = DB;
