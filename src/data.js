"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("./util"));
const merkle_patricia_1 = require("./merkle_patricia");
const Merkle = require('merkle-patricia-tree/secure');
const util_1 = require("util");
class PromiseMerkle {
    constructor(_db, _root) {
        this._root = _root;
        this.merkle = _root != null ? new Merkle(_db.set_db.raw_db, _root) : new Merkle(_db.set_db.raw_db);
    }
    get root() {
        return this.merkle.root;
    }
    async get(key) {
        return await util_1.promisify(this.merkle.get).bind(this.merkle)(key);
    }
    async put(key, value) {
        console.log(this.merkle);
        await util_1.promisify(this.merkle.put).bind(this.merkle)(key, value);
    }
    async del(key) {
        await util_1.promisify(this.merkle.del).bind(this.merkle)(key);
    }
    createReadStream() {
        return this.merkle.createReadStream();
    }
}
exports.db_trie_ins = (db, root) => {
    return new merkle_patricia_1.Trie(new PromiseMerkle(db, root));
};
exports.read_from_trie = async (trie, db, key, index, empty) => {
    const hashes = await trie.get(key);
    if (hashes == null)
        return empty;
    const raw = await db.read_obj(hashes[index]);
    if (raw == null)
        return empty;
    else
        return raw;
};
exports.write_state_hash = async (db, state) => {
    const hash = _.array2hash([state.nonce, state.token, state.owner, state.amount].concat(state.data));
    await db.del(hash);
    await db.write_obj(hash, state);
    return hash;
};
exports.write_lock_hash = async (db, lock) => {
    const state = "0" + lock.state.toString(16);
    let index = lock.index.toString(16);
    if (index.length % 2 != 0)
        index = "0" + index;
    const hash = _.array2hash([lock.address, state, lock.height, lock.block_hash, index, lock.tx_hash]);
    await db.del(hash);
    await db.write_obj(hash, lock);
    return hash;
};
exports.write_trie = async (trie, state_db, lock_db, state, lock) => {
    await trie.delete(state.owner);
    const state_hash = await exports.write_state_hash(state_db, state);
    const lock_hash = await exports.write_lock_hash(lock_db, lock);
    await trie.put(state.owner, [state_hash, lock_hash]);
};
