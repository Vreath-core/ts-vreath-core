"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const levelup_1 = __importDefault(require("levelup"));
const db_1 = require("../src/db");
const memdown_1 = __importDefault(require("memdown"));
class leveldb {
    constructor(_db) {
        this.db = _db;
    }
    async get(key) {
        const got = await this.db.get(key);
        if (typeof got === 'string')
            return Buffer.from(key);
        else
            return got;
    }
    async put(key, val) {
        await this.db.put(key, val);
    }
    async del(key) {
        await this.db.del(key);
    }
    createReadStream() {
        return this.db.createReadStream();
    }
    get raw_db() {
        return this.db;
    }
}
exports.leveldb = leveldb;
exports.make_db_obj = () => {
    const levelup_obj = new levelup_1.default(memdown_1.default());
    const leveldb_obj = new leveldb(levelup_obj);
    return new db_1.DB(leveldb_obj);
};
