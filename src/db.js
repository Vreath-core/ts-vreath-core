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
    async get(key, encode = 'utf8') {
        const buffer = await this.db.get(key);
        return buffer.toString(encode);
    }
    async put(key, val, key_encode = 'hex', val_encode = 'utf8') {
        await this.db.put(Buffer.from(key, key_encode), Buffer.from(val, val_encode));
    }
    async del(key) {
        await this.db.del(key);
    }
    async read_obj(key) {
        return JSON.parse(await this.get(key));
    }
    async write_obj(key, obj) {
        await this.put(key, JSON.stringify(obj));
    }
}
exports.DB = DB;
