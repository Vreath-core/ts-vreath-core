"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const data_set = __importStar(require("../src/data"));
const path = __importStar(require("path"));
const levelup_1 = __importDefault(require("levelup"));
const leveldown_1 = __importDefault(require("leveldown"));
const db_1 = require("../src/db");
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
const make_db_obj = (root) => {
    const levelup_obj = new levelup_1.default(leveldown_1.default(path.join(root)));
    const leveldb_obj = new leveldb(levelup_obj);
    return new db_1.DB(leveldb_obj);
};
describe("data_set", () => {
    const db = make_db_obj(path.join(__dirname, `../test_db/trie`));
    const trie = data_set.db_trie_ins(db);
    const alice = "123456";
    const state1 = { nonce: 10, owner: alice, amount: 100 };
    const bob = "789876";
    const state2 = { nonce: 20, owner: bob, amount: 200 };
    it("trie_ins", async () => {
        await trie.put(alice, state1);
        assert.deepEqual(await trie.get(alice), state1, 'error in get and put funcs');
        await trie.delete(alice);
        assert.equal(await trie.get(alice), null, "error in del funcs");
    });
});
