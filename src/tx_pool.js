"use strict";
exports.__esModule = true;
var TxSet = require("./tx");
var _ = require("./basic");
var check_tx = function (tx, chain, StateData, LockData) {
    if (tx.meta.kind == "request") {
        return TxSet.ValidRequestTx(tx, false, StateData, LockData);
    }
    else if (tx.meta.kind == "refresh") {
        return TxSet.ValidRefreshTx(tx, chain, true, StateData, LockData);
    }
    else
        return false;
};
exports.Tx_to_Pool = function (pool, tx, chain, StateData, LockData) {
    if (!check_tx(tx, chain, StateData, LockData))
        return pool;
    var new_pool = _.new_obj(pool, function (p) {
        p[tx.hash] = tx;
        return p;
    });
    return new_pool;
};
