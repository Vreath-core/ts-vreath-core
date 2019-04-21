"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tx_set = __importStar(require("./tx"));
const check_tx = (tx, output_states, block_db, trie, state_db, lock_db, last_height) => {
    if (tx.meta.kind === 0) {
        return tx_set.verify_req_tx(tx, trie, state_db, lock_db, [5]);
    }
    else if (tx.meta.kind === 1) {
        return tx_set.verify_ref_tx(tx, output_states, block_db, trie, state_db, lock_db, last_height, []);
    }
    else
        return false;
};
exports.tx2pool = async (pool_db, tx, output_states, block_db, trie, state_db, lock_db, last_height) => {
    if (check_tx(tx, output_states, block_db, trie, state_db, lock_db, last_height)) {
        await pool_db.write_obj(tx.hash, tx);
    }
};
