"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const TxSet = __importStar(require("./tx"));
const _ = __importStar(require("./basic"));
const check_tx = (tx, chain, StateData, LockData) => {
    if (tx.meta.kind == "request") {
        return TxSet.ValidRequestTx(tx, false, StateData, LockData);
    }
    else if (tx.meta.kind == "refresh") {
        return TxSet.ValidRefreshTx(tx, chain, true, StateData, LockData);
    }
    else
        return false;
};
exports.Tx_to_Pool = (pool, tx, chain, StateData, LockData) => {
    if (!check_tx(tx, chain, StateData, LockData))
        return pool;
    const new_pool = _.new_obj(pool, p => {
        p[tx.hash] = tx;
        return p;
    });
    return new_pool;
};
