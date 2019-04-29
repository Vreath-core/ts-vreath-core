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
const crypto_set = __importStar(require("./crypto_set"));
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
    const hash = crypto_set.get_sha256(_.hex_sum([state.nonce, state.token, state.token, state.amount].concat(state.data)));
    await db.write_obj(hash, state);
    return hash;
};
exports.write_lock_hash = async (db, lock) => {
    const hash = crypto_set.get_sha256(_.hex_sum([lock.address, lock.index.toString(16), lock.height, lock.index.toString(16), lock.tx_hash]));
    await db.write_obj(hash, lock);
    return hash;
};
exports.write_trie = async (trie, state_db, lock_db, state, lock) => {
    const state_hash = await exports.write_state_hash(state_db, state);
    const lock_hash = await exports.write_lock_hash(lock_db, lock);
    await trie.put(state.owner, [state_hash, lock_hash]);
};
