"use strict";
exports.__esModule = true;
var _ = require("./basic");
var CryptoSet = require("./crypto_set");
var StateSet = require("./state");
var TxSet = require("./tx");
var lwma_1 = require("./lwma");
var math = require("mathjs");
var con_1 = require("./con");
math.config({
    number: 'BigNumber'
});
exports.empty_block = function () {
    var meta = {
        kind: 'key',
        version: 0,
        network_id: 0,
        chain_id: 0,
        validator: '',
        height: 0,
        previoushash: '',
        timestamp: 0,
        pos_diff: 0,
        validatorPub: [],
        stateroot: '',
        lockroot: '',
        tx_root: '',
        fee_sum: 0,
        extra: ''
    };
    var hash = _.ObjectHash(meta);
    return {
        hash: hash,
        validatorSign: [],
        meta: meta,
        txs: [],
        raws: []
    };
};
exports.search_key_block = function (chain) {
    var block;
    for (var _i = 0, _a = chain.slice().reverse(); _i < _a.length; _i++) {
        block = _a[_i];
        if (block.meta.kind === "key")
            return block;
    }
    return exports.empty_block();
};
exports.search_micro_block = function (chain, key_block) {
    return chain.slice(key_block.meta.height).filter(function (block) {
        return block.meta.kind === "micro" && block.meta.validator === key_block.meta.validator;
    });
};
exports.GetTreeroot = function (pre) {
    if (pre.length == 0)
        return [_.toHash("")];
    else if (pre.length == 1)
        return pre;
    else {
        var union = pre.reduce(function (result, val, index, array) {
            var i = Number(index);
            if (i % 2 == 0) {
                var left = val;
                var right = (function (left, i, array) {
                    if (array[i + 1] == null)
                        return _.toHash("");
                    else
                        return array[i + 1];
                })(left, i, array);
                return result.concat(_.toHash(left + right));
            }
            else
                return result;
        }, []);
        return exports.GetTreeroot(union);
    }
};
var tx_fee_sum = function (pure_txs, raws) {
    var txs = pure_txs.map(function (t, i) {
        return {
            hash: t.hash,
            meta: t.meta,
            raw: raws[i],
            additional: t.additional
        };
    });
    return txs.reduce(function (sum, tx) { return math.chain(sum).add(TxSet.tx_fee(tx)).done(); }, 0);
};
exports.pos_hash = function (previoushash, address, timestamp) {
    return _.toHashNum(math.chain(_.Hex_to_Num(previoushash)).add(_.toHashNum(address)).add(timestamp).done().toString());
};
/*const PoS_mining = (previoushash:string,address:string,balance:number,difficulty:number)=>{
    let date;
    let timestamp
    let i=0;
    do {
      date = new Date();
      timestamp = date.getTime();
      i++;
      if(i>1000) break;
    } while (math.chain(2**256).multiply(balance).divide(difficulty).smaller(pos_hash(previoushash,address,timestamp)));
    return timestamp;
}*/
/*export const Wait_block_time = (pre:number,block_time:number)=>{
    let date;
    let timestamp;
    do{
        date = new Date();
        timestamp = date.getTime();
    } while(math.chain(timestamp).subtract(pre).smaller(block_time))
    return timestamp;
}*/
exports.txs_check = function (block, chain, StateData, LocationData) {
    var txs = block.txs.map(function (tx, i) {
        return {
            hash: tx.hash,
            meta: tx.meta,
            raw: block.raws[i],
            additional: tx.additional
        };
    });
    return txs.some(function (tx) {
        if (tx.meta.kind === "request") {
            return !TxSet.ValidRequestTx(tx, true, StateData, LocationData);
        }
        else if (tx.meta.kind === "refresh") {
            return !TxSet.ValidRefreshTx(tx, chain, true, StateData, LocationData);
        }
        else
            return true;
    });
};
exports.ValidKeyBlock = function (block, chain, right_stateroot, right_lockroot, StateData) {
    var hash = block.hash;
    var sign = block.validatorSign;
    var meta = block.meta;
    var version = meta.version;
    var network_id = meta.network_id;
    var chain_id = meta.chain_id;
    var validator = meta.validator;
    var height = meta.height;
    var previoushash = meta.previoushash;
    var timestamp = meta.timestamp;
    var pos_diff = meta.pos_diff;
    var validatorPub = meta.validatorPub;
    var stateroot = meta.stateroot;
    var lockroot = meta.lockroot;
    var tx_root = meta.tx_root;
    var fee_sum = meta.fee_sum;
    var txs = block.txs;
    var raws = block.raws;
    var last = chain[chain.length - 1] || exports.empty_block();
    var right_previoushash = last.hash;
    var lwma_infos = chain.slice(-1 * con_1.constant.lwma_size * (1 + con_1.constant.max_blocks)).filter(function (block) { return block.meta.kind === 'key'; }).reduce(function (res, block) {
        res.times = res.times.concat(block.meta.timestamp);
        res.diffs = res.diffs.concat(block.meta.pos_diff);
        return res;
    }, { times: [], diffs: [] });
    var right_diff = lwma_1.get_diff(lwma_infos.diffs, con_1.constant.block_time * (con_1.constant.max_blocks + 1), lwma_infos.times);
    var native_validator = CryptoSet.GenerateAddress(con_1.constant.native, _.reduce_pub(validatorPub));
    var unit_validator = CryptoSet.GenerateAddress(con_1.constant.unit, _.reduce_pub(validatorPub));
    var unit_validator_state = StateData.filter(function (s) { return s.kind === "state" && s.owner === unit_validator && s.token === con_1.constant.unit; })[0] || StateSet.CreateState(0, unit_validator, con_1.constant.unit, 0);
    if (_.object_hash_check(hash, meta) || math.chain(Math.pow(2, 256)).multiply(unit_validator_state.amount).divide(right_diff).smaller(exports.pos_hash(last.hash, unit_validator, timestamp)).done()) {
        //console.log("invalid hash");
        return false;
    }
    else if (validator != native_validator || unit_validator_state.amount === 0) {
        //console.log("invalid validator");
        return false;
    }
    else if (sign.length === 0 || sign.some(function (s, i) { return _.sign_check(hash, s, validatorPub[i]); })) {
        //console.log("invalid validator signature");
        return false;
    }
    else if (version != con_1.constant.my_version) {
        //console.log("invalid version");
        return false;
    }
    else if (network_id != con_1.constant.my_net_id) {
        //console.log("invalid network id");
        return false;
    }
    else if (chain_id != con_1.constant.my_chain_id) {
        //console.log("invalid chain id");
        return false;
    }
    else if (height != chain.length) {
        //console.log("invalid height");
        return false;
    }
    else if (previoushash != right_previoushash) {
        //console.log("invalid parenthash");
        return false;
    }
    else if (timestamp.toString().length != 10 || _.time_check(timestamp)) {
        //console.log("invalid timestamp");
        return false;
    }
    else if (pos_diff != right_diff) {
        //console.log("invalid pos_diff");
        return false;
    }
    else if (stateroot != right_stateroot) {
        //console.log("invalid stateroot");
        return false;
    }
    else if (lockroot != right_lockroot) {
        //console.log("invalid location");
        return false;
    }
    else if (tx_root != _.toHash("")) {
        //console.log("invalid tx_root");
        return false;
    }
    else if (fee_sum != 0) {
        //console.log("invalid fee_sum");
        return false;
    }
    else if (txs.length > 0) {
        //console.log("invalid txs");
        return false;
    }
    else if (raws.length > 0) {
        //console.log("invalid raws");
        return false;
    }
    else if (math.chain(Buffer.from(_.Object2string(meta) + _.Object2string(block.txs) + _.Object2string(block.raws) + _.Object2string(block.validatorSign)).length).larger(con_1.constant.block_size).done()) {
        //console.log("too big block");
        return false;
    }
    else {
        return true;
    }
};
exports.ValidMicroBlock = function (block, chain, right_stateroot, right_lockroot, StateData, LockData) {
    var hash = block.hash;
    var sign = block.validatorSign;
    var meta = block.meta;
    var version = meta.version;
    var network_id = meta.network_id;
    var chain_id = meta.chain_id;
    var validator = meta.validator;
    var height = meta.height;
    var previoushash = meta.previoushash;
    var timestamp = meta.timestamp;
    var pos_diff = meta.pos_diff;
    var stateroot = meta.stateroot;
    var lockroot = meta.lockroot;
    var tx_root = meta.tx_root;
    var fee_sum = meta.fee_sum;
    var txs = block.txs;
    var raws = block.raws;
    var last = chain[chain.length - 1] || exports.empty_block();
    var right_previoushash = last.hash;
    var key_block = exports.search_key_block(chain);
    var validatorPub = key_block.meta.validatorPub;
    var tx_roots = txs.map(function (t) { return t.hash; });
    var date = new Date();
    var now = Math.floor(date.getTime() / 1000);
    var already_micro = exports.search_micro_block(chain, key_block);
    if (_.object_hash_check(hash, meta)) {
        //console.log("invalid hash");
        return false;
    }
    else if (sign.length === 0 || sign.some(function (s, i) { return _.sign_check(hash, s, validatorPub[i]); })) {
        //console.log("invalid validator signature");
        return false;
    }
    else if (version != con_1.constant.my_version) {
        //console.log("invalid version");
        return false;
    }
    else if (network_id != con_1.constant.my_net_id) {
        //console.log("invalid network_id");
        return false;
    }
    else if (chain_id != con_1.constant.my_chain_id) {
        //console.log("invalid chain id");
        return false;
    }
    else if (validator != key_block.meta.validator) {
        //console.log("invalid validator");
        return false;
    }
    else if (height != chain.length) {
        //console.log("invalid height");
        return false;
    }
    else if (previoushash != right_previoushash) {
        //console.log("invalid parenthash");
        return false;
    }
    else if (last.hash === exports.empty_block().hash || timestamp.toString().length != 10 || _.time_check(timestamp) || math.chain(now).subtract(last.meta.timestamp).smaller(con_1.constant.block_time).done()) {
        //console.log("invalid timestamp");
        return false;
    }
    else if (pos_diff != key_block.meta.pos_diff) {
        //console.log("invalid pos_diff");
        return false;
    }
    else if (_.ObjectHash(block.meta.validatorPub) != _.ObjectHash([])) {
        //console.log("invalid validator public key");
        return false;
    }
    else if (stateroot != right_stateroot) {
        //console.log("invalid stateroot");
        return false;
    }
    else if (lockroot != right_lockroot) {
        //console.log("invalid location");
        return false;
    }
    else if (tx_root != exports.GetTreeroot(tx_roots)[0]) {
        //console.log("invalid tx_root");
        return false;
    }
    else if (fee_sum != tx_fee_sum(txs, raws)) {
        //console.log("invalid fee_sum");
        return false;
    }
    else if (txs.length != raws.length) {
        //console.log("invalid raws");
        return false;
    }
    else if (math.chain(Buffer.from(_.Object2string(meta) + _.Object2string(block.txs) + _.Object2string(block.raws) + _.Object2string(block.validatorSign)).length).larger(con_1.constant.block_size).done()) {
        //console.log("too big block");
        return false;
    }
    else if (already_micro.length > con_1.constant.max_blocks) {
        //console.log("too many micro blocks");
        return false;
    }
    else if (exports.txs_check(block, chain, StateData, LockData)) {
        //console.log("invalid txs");
        return false;
    }
    else if ((height % 10 === 0 && txs.some(function (tx) { return tx.meta.kind === 'request' && _.ObjectHash(tx.meta.tokens) != _.ObjectHash([con_1.constant.unit, con_1.constant.native]); })) || (height % 10 != 0 && txs.some(function (tx) { return tx.meta.kind === 'request' && _.ObjectHash(tx.meta.tokens) === _.ObjectHash([con_1.constant.unit, con_1.constant.native]); }))) {
        //console.log("invalid kind of txs")
        return false;
    }
    else {
        return true;
    }
};
exports.CreateKeyBlock = function (chain, validatorPub, stateroot, lockroot, extra) {
    var empty = exports.empty_block();
    var last = chain[chain.length - 1] || empty;
    var previoushash = last.hash;
    var native_validator = CryptoSet.GenerateAddress(con_1.constant.native, _.reduce_pub(validatorPub));
    var lwma_infos = chain.slice(-1 * con_1.constant.lwma_size * (1 + con_1.constant.max_blocks)).filter(function (block) { return block.meta.kind === 'key'; }).reduce(function (res, block) {
        res.times = res.times.concat(block.meta.timestamp);
        res.diffs = res.diffs.concat(block.meta.pos_diff);
        return res;
    }, { times: [], diffs: [] });
    var pos_diff = lwma_1.get_diff(lwma_infos.diffs, con_1.constant.block_time * con_1.constant.max_blocks, lwma_infos.times);
    var date = new Date();
    var timestamp = Math.floor(date.getTime() / 1000);
    var meta = {
        kind: 'key',
        version: con_1.constant.my_version,
        network_id: con_1.constant.my_net_id,
        chain_id: con_1.constant.my_chain_id,
        validator: native_validator,
        height: chain.length,
        previoushash: previoushash,
        timestamp: timestamp,
        pos_diff: pos_diff,
        validatorPub: validatorPub,
        stateroot: stateroot,
        lockroot: lockroot,
        tx_root: _.toHash(''),
        fee_sum: 0,
        extra: extra
    };
    var hash = _.ObjectHash(meta);
    return {
        hash: hash,
        validatorSign: [],
        meta: meta,
        txs: [],
        raws: []
    };
};
exports.CreateMicroBlock = function (chain, stateroot, lockroot, txs, extra) {
    var empty = exports.empty_block();
    var last = chain[chain.length - 1] || empty;
    var key = exports.search_key_block(chain);
    var date = new Date();
    var timestamp = Math.floor(date.getTime() / 1000);
    var pures = txs.map(function (tx) { return TxSet.tx_to_pure(tx); });
    var raws = txs.map(function (tx) { return tx.raw; });
    var tx_root = exports.GetTreeroot(txs.map(function (t) { return t.hash; }))[0];
    var fee_sum = tx_fee_sum(pures, raws);
    var meta = {
        kind: 'micro',
        version: con_1.constant.my_version,
        network_id: con_1.constant.my_net_id,
        chain_id: con_1.constant.my_chain_id,
        validator: key.meta.validator,
        height: chain.length,
        previoushash: last.hash,
        timestamp: timestamp,
        pos_diff: key.meta.pos_diff,
        validatorPub: [],
        stateroot: stateroot,
        lockroot: lockroot,
        tx_root: tx_root,
        fee_sum: fee_sum,
        extra: extra
    };
    var hash = _.ObjectHash(meta);
    return {
        hash: hash,
        validatorSign: [],
        meta: meta,
        txs: pures,
        raws: raws
    };
};
exports.SignBlock = function (block, pub_keys, my_private, my_pub) {
    var index = pub_keys.indexOf(my_pub);
    if (index === -1)
        return block;
    var sign = CryptoSet.SignData(block.hash, my_private);
    var signed = _.new_obj(block, function (b) {
        b.validatorSign[index] = sign;
        return b;
    });
    return signed;
};
var compute_issue = function (height) {
    var all_issue = con_1.constant.all_issue;
    var cycle = con_1.constant.cycle;
    var n = math.chain(height).divide(cycle).fix().done();
    var new_amount = math.chain(all_issue).multiply(math.pow(0.5, n + 1)).done();
    var pre_amount = math.chain(all_issue).multiply(math.pow(0.5, n)).done();
    var issue = math.chain(pre_amount).subtract(new_amount).divide(cycle).done();
    if (math.chain(issue).smallerEq(math.pow(10, -18)).done())
        return 0;
    else
        return issue;
};
exports.AcceptKeyBlock = function (block, chain, StateData, LockData) {
    var last_key = exports.search_key_block(chain);
    var last_micros = exports.search_micro_block(chain, last_key);
    var fees = last_micros.reduce(function (sum, b) { return math.chain(sum).add(b.meta.fee_sum).done(); }, 0);
    var issues = last_micros.concat(last_key).reduce(function (sum, b) { return math.chain(sum).add(compute_issue(b.meta.height)).done(); }, 0);
    var fee_sum = math.chain(fees).add(issues).done();
    var pre_fee = math.multiply(fee_sum, 0.4);
    var next_fee = math.multiply(fee_sum, 0.6);
    var paid = StateData.map(function (s) {
        var fee = Number(s.data.fee || "0");
        if (fee === 0)
            return s;
        return _.new_obj(s, function (s) {
            s.amount = math.chain(s.amount).subtract(fee).done();
            s.data.fee = "0";
            return s;
        });
    });
    var validators = [last_key.meta.validator, block.meta.validator];
    var gained = paid.map(function (s) {
        var i = validators.indexOf(s.owner);
        if (i === -1)
            return s;
        var gain = (function () {
            if (i === 0)
                return pre_fee;
            else if (i === 1)
                return next_fee;
            else
                return 0;
        })();
        return _.new_obj(s, function (s) {
            s.amount = math.chain(s.amount).add(gain).done();
            s.data.income = math.chain(Number(s.data.income || "0")).add(gain).done().toFixed(18);
            return s;
        });
    });
    var reduced = gained.map(function (s) {
        if (s.kind != "state" || s.token != con_1.constant.unit)
            return s;
        return _.new_obj(s, function (s) {
            s.amount = math.chain(s.amount).multiply(con_1.constant.unit_rate).done();
            return s;
        });
    });
    return [reduced, LockData];
};
exports.AcceptMicroBlock = function (block, chain, StateData, LockData) {
    var first_data = [StateData, LockData];
    var txs = block.txs.map(function (pure) { return TxSet.pure_to_tx(pure, block); });
    var txed = txs.reduce(function (data, tx, i) {
        if (tx.meta.kind === "request")
            return TxSet.AcceptRequestTx(tx, block.meta.height, block.hash, i, data[0], data[1]);
        else if (tx.meta.kind === "refresh")
            return TxSet.AcceptRefreshTx(tx, chain, data[0], data[1]);
        else
            return data;
    }, first_data);
    var reduced = txed[0].map(function (s) {
        if (s.kind != "state" || s.token != con_1.constant.unit)
            return s;
        return _.new_obj(s, function (s) {
            s.amount = math.chain(s.amount).multiply(con_1.constant.unit_rate).done();
            return s;
        });
    });
    return [reduced, txed[1]];
};
