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
exports.trie_ins = (db, root) => {
    if (root == null)
        return new merkle_patricia_1.Trie(db);
    else
        return new merkle_patricia_1.Trie(db, root);
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
