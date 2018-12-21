"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("./basic"));
const CryptoSet = __importStar(require("./crypto_set"));
const StateSet = __importStar(require("./state"));
const TxSet = __importStar(require("./tx"));
const lwma_1 = require("./lwma");
const math = __importStar(require("mathjs"));
const con_1 = require("./con");
math.config({
    number: 'BigNumber'
});
exports.empty_block = () => {
    const meta = {
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
    const hash = _.ObjectHash(meta);
    return {
        hash: hash,
        validatorSign: [],
        meta: meta,
        txs: [],
        raws: []
    };
};
exports.search_key_block = (chain) => {
    let block;
    for (block of chain.slice().reverse()) {
        if (block.meta.kind === "key")
            return block;
    }
    return exports.empty_block();
};
exports.search_micro_block = (chain, key_block) => {
    return chain.slice(key_block.meta.height).filter((block) => {
        return block.meta.kind === "micro" && block.meta.validator === key_block.meta.validator;
    });
};
exports.GetTreeroot = (pre) => {
    if (pre.length == 0)
        return [_.toHash("")];
    else if (pre.length == 1)
        return pre;
    else {
        const union = pre.reduce((result, val, index, array) => {
            const i = Number(index);
            if (i % 2 == 0) {
                const left = val;
                const right = ((left, i, array) => {
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
const tx_fee_sum = (pure_txs, raws) => {
    const txs = pure_txs.map((t, i) => {
        return {
            hash: t.hash,
            meta: t.meta,
            raw: raws[i],
            additional: t.additional
        };
    });
    return txs.reduce((sum, tx) => math.chain(sum).add(TxSet.tx_fee(tx)).done(), 0);
};
const pos_hash = (previoushash, address, timestamp) => {
    return _.toHashNum(math.chain(_.Hex_to_Num(previoushash)).add(_.toHashNum(address)).add(timestamp).done().toString());
};
const PoS_mining = (previoushash, address, balance, difficulty) => {
    let date;
    let timestamp;
    let i = 0;
    do {
        date = new Date();
        timestamp = date.getTime();
        i++;
        if (i > 1000)
            break;
    } while (math.chain(2 ** 256).multiply(balance).divide(difficulty).smaller(pos_hash(previoushash, address, timestamp)));
    return timestamp;
};
const Wait_block_time = (pre, block_time) => {
    let date;
    let timestamp;
    do {
        date = new Date();
        timestamp = date.getTime();
    } while (math.chain(timestamp).subtract(pre).smaller(block_time));
    return timestamp;
};
exports.txs_check = (block, chain, StateData, LocationData) => {
    const txs = block.txs.map((tx, i) => {
        return {
            hash: tx.hash,
            meta: tx.meta,
            raw: block.raws[i],
            additional: tx.additional
        };
    });
    return txs.some((tx) => {
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
exports.ValidKeyBlock = (block, chain, right_stateroot, right_lockroot, StateData) => {
    const hash = block.hash;
    const sign = block.validatorSign;
    const meta = block.meta;
    const version = meta.version;
    const network_id = meta.network_id;
    const chain_id = meta.chain_id;
    const validator = meta.validator;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const validatorPub = meta.validatorPub;
    const stateroot = meta.stateroot;
    const lockroot = meta.lockroot;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;
    const raws = block.raws;
    const last = chain[chain.length - 1] || exports.empty_block();
    const right_previoushash = last.hash;
    const genesis_time = chain[0].meta.timestamp;
    const lwma_infos = chain.reduce((res, block) => {
        res.times = res.times.concat(math.chain(block.meta.timestamp).subtract(genesis_time).done());
        res.diffs = res.diffs.concat(block.meta.pos_diff);
        return res;
    }, { times: [], diffs: [] });
    const right_diff = lwma_1.get_diff(lwma_infos.diffs, con_1.constant.block_time * con_1.constant.max_blocks, lwma_infos.times);
    const native_validator = CryptoSet.GenereateAddress(con_1.constant.native, _.reduce_pub(validatorPub));
    const unit_validator = CryptoSet.GenereateAddress(con_1.constant.unit, _.reduce_pub(validatorPub));
    const unit_validator_state = StateData.filter(s => s.kind === "state" && s.owner === unit_validator && s.token === con_1.constant.unit)[0] || StateSet.CreateState(0, unit_validator, con_1.constant.unit, 0);
    if (_.object_hash_check(hash, meta) || math.chain(2 ** 256).multiply(unit_validator_state.amount).divide(right_diff).largerEq(pos_hash(last.hash, unit_validator, timestamp))) {
        console.log("invalid hash");
        return false;
    }
    else if (validator != native_validator || unit_validator_state.amount === 0) {
        console.log("invalid validator");
        return false;
    }
    else if (sign.length === 0 || sign.some((s, i) => _.sign_check(hash, s, validatorPub[i]))) {
        console.log("invalid validator signature");
        return false;
    }
    else if (version != con_1.constant.my_version) {
        console.log("invalid version");
        return false;
    }
    else if (network_id != con_1.constant.my_net_id) {
        console.log("invalid network id");
        return false;
    }
    else if (chain_id != con_1.constant.my_chain_id) {
        console.log("invalid chain id");
        return false;
    }
    else if (height != chain.length) {
        console.log("invalid height");
        return false;
    }
    else if (previoushash != right_previoushash) {
        console.log("invalid parenthash");
        return false;
    }
    else if (_.time_check(timestamp)) {
        console.log("invalid timestamp");
        return false;
    }
    else if (pos_diff != right_diff) {
        console.log("invalid pos_diff");
        return false;
    }
    else if (stateroot != right_stateroot) {
        console.log("invalid stateroot");
        return false;
    }
    else if (lockroot != right_lockroot) {
        console.log("invalid location");
        return false;
    }
    else if (tx_root != _.toHash("")) {
        console.log("invalid tx_root");
        return false;
    }
    else if (fee_sum != 0) {
        console.log("invalid fee_sum");
        return false;
    }
    else if (txs.length > 0) {
        console.log("invalid txs");
        return false;
    }
    else if (raws.length > 0) {
        console.log("invalid raws");
        return false;
    }
    else if (math.chain(Buffer.from(_.Object2string(meta) + _.Object2string(block.txs) + _.Object2string(block.raws) + _.Object2string(block.validatorSign)).length).larger(con_1.constant.max_blocks)) {
        console.log("too big block");
        return false;
    }
    else {
        return true;
    }
};
exports.ValidMicroBlock = (block, chain, right_stateroot, right_lockroot, StateData, LockData) => {
    const hash = block.hash;
    const sign = block.validatorSign;
    const meta = block.meta;
    const version = meta.version;
    const network_id = meta.network_id;
    const chain_id = meta.chain_id;
    const validator = meta.validator;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const stateroot = meta.stateroot;
    const lockroot = meta.lockroot;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;
    const raws = block.raws;
    const last = chain[chain.length - 1] || exports.empty_block();
    const right_previoushash = last.hash;
    const key_block = exports.search_key_block(chain);
    const validatorPub = key_block.meta.validatorPub;
    const tx_roots = txs.map(t => t.hash);
    const date = new Date();
    const now = date.getTime();
    const already_micro = exports.search_micro_block(chain, key_block);
    if (_.object_hash_check(hash, meta)) {
        console.log("invalid hash");
        return false;
    }
    else if (sign.length === 0 || sign.some((s, i) => _.sign_check(hash, s, validatorPub[i]))) {
        console.log("invalid validator signature");
        return false;
    }
    else if (version != con_1.constant.my_version) {
        console.log("invalid version");
        return false;
    }
    else if (network_id != con_1.constant.my_net_id) {
        console.log("invalid network_id");
        return false;
    }
    else if (chain_id != con_1.constant.my_chain_id) {
        console.log("invalid chain id");
        return false;
    }
    else if (validator != key_block.meta.validator) {
        console.log("invalid validator");
        return false;
    }
    else if (height != chain.length) {
        console.log("invalid height");
        return false;
    }
    else if (previoushash != right_previoushash) {
        console.log("invalid parenthash");
        return false;
    }
    else if (last.hash === exports.empty_block().hash || _.time_check(timestamp) || math.chain(now).subtract(last.meta.timestamp).smaller(con_1.constant.block_time)) {
        console.log("invalid timestamp");
        return false;
    }
    else if (pos_diff != key_block.meta.pos_diff) {
        console.log("invalid pos_diff");
        return false;
    }
    else if (_.ObjectHash(validatorPub) != _.ObjectHash([])) {
        console.log("invalid validator public key");
        return false;
    }
    else if (stateroot != right_stateroot) {
        console.log("invalid stateroot");
        return false;
    }
    else if (lockroot != right_lockroot) {
        console.log("invalid location");
        return false;
    }
    else if (tx_root != exports.GetTreeroot(tx_roots)[0]) {
        console.log("invalid tx_root");
        return false;
    }
    else if (fee_sum != tx_fee_sum(txs, raws)) {
        console.log("invalid fee_sum");
        return false;
    }
    else if (txs.length != raws.length) {
        console.log("invalid raws");
        return false;
    }
    else if (math.chain(Buffer.from(_.Object2string(meta) + _.Object2string(block.txs) + _.Object2string(block.raws) + _.Object2string(block.validatorSign)).length).larger(con_1.constant.max_blocks)) {
        console.log("too big block");
        return false;
    }
    else if (already_micro.length > con_1.constant.max_blocks) {
        console.log("too many micro blocks");
        return false;
    }
    else if (exports.txs_check(block, chain, StateData, LockData)) {
        console.log("invalid txs");
        return false;
    }
    else {
        return true;
    }
};
exports.CreateKeyBlock = (chain, validatorPub, stateroot, lockroot, extra, StateData) => {
    const empty = exports.empty_block();
    const last = chain[chain.length - 1] || empty;
    const parenthash = last.hash;
    const native_validator = CryptoSet.GenereateAddress(con_1.constant.native, _.reduce_pub(validatorPub));
    const unit_validator = CryptoSet.GenereateAddress(con_1.constant.unit, _.reduce_pub(validatorPub));
    const validator_state = StateData.filter(s => { return s.kind === "state" && s.owner === unit_validator && s.token === con_1.constant.unit; })[0] || StateSet.CreateState(0, unit_validator, con_1.constant.unit, 0);
    const genesis_time = chain[0].meta.timestamp;
    const lwma_infos = chain.reduce((res, block) => {
        res.times = res.times.concat(math.chain(block.meta.timestamp).subtract(genesis_time).done());
        res.diffs = res.diffs.concat(block.meta.pos_diff);
        return res;
    }, { times: [], diffs: [] });
    const pos_diff = lwma_1.get_diff(lwma_infos.diffs, con_1.constant.block_time * con_1.constant.max_blocks, lwma_infos.times);
    const timestamp = PoS_mining(parenthash, unit_validator, validator_state.amount, pos_diff);
    const meta = {
        kind: 'key',
        version: con_1.constant.my_version,
        network_id: con_1.constant.my_net_id,
        chain_id: con_1.constant.my_chain_id,
        validator: native_validator,
        height: chain.length,
        previoushash: last.hash,
        timestamp: timestamp,
        pos_diff: pos_diff,
        validatorPub: validatorPub,
        stateroot: stateroot,
        lockroot: lockroot,
        tx_root: _.toHash(''),
        fee_sum: 0,
        extra: extra
    };
    const hash = _.ObjectHash(meta);
    return {
        hash: hash,
        validatorSign: [],
        meta: meta,
        txs: [],
        raws: []
    };
};
exports.CreateMicroBlock = (chain, stateroot, lockroot, txs, extra) => {
    const empty = exports.empty_block();
    const last = chain[chain.length - 1] || empty;
    const key = exports.search_key_block(chain);
    const timestamp = Wait_block_time(last.meta.timestamp, con_1.constant.block_time);
    const pures = txs.map(tx => TxSet.tx_to_pure(tx));
    const raws = txs.map(tx => tx.raw);
    const tx_root = exports.GetTreeroot(txs.map(t => t.hash))[0];
    const fee_sum = tx_fee_sum(pures, raws);
    const meta = {
        kind: 'key',
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
    const hash = _.ObjectHash(meta);
    return {
        hash: hash,
        validatorSign: [],
        meta: meta,
        txs: pures,
        raws: raws
    };
};
exports.SignBlock = (block, my_private, my_pub) => {
    const index = block.meta.validatorPub.indexOf(my_pub);
    if (index === -1)
        return block;
    const sign = CryptoSet.SignData(block.hash, my_private);
    block.validatorSign[index] = sign;
    return block;
};
const compute_issue = (height) => {
    const all_issue = con_1.constant.all_issue;
    const cycle = con_1.constant.cycle;
    const n = math.chain(height).divide(cycle).fix().done();
    const new_amount = math.chain(all_issue).multiply(math.pow(0.5, n + 1)).done();
    const pre_amount = math.chain(all_issue).multiply(math.pow(0.5, n)).done();
    const issue = math.chain(pre_amount).subtract(new_amount).divide(cycle).done();
    if (math.chain(issue).smallerEq(math.pow(10, -18)))
        return 0;
    else
        return issue;
};
exports.AcceptKeyBlock = (block, chain, StateData, LockData) => {
    const last_key = exports.search_key_block(chain);
    const last_micros = exports.search_micro_block(chain, last_key);
    const fees = last_micros.reduce((sum, b) => math.chain(sum).add(b.meta.fee_sum).done(), 0);
    const issues = last_micros.concat(last_key).reduce((sum, b) => math.chain(sum).add(compute_issue(b.meta.height)).done(), 0);
    const fee_sum = math.chain(fees).add(issues).done();
    const pre_fee = math.multiply(fee_sum, 0.4);
    const next_fee = math.multiply(fee_sum, 0.6);
    const paid = StateData.map(s => {
        const fee = Number(s.data.fee || "0");
        if (fee === 0)
            return s;
        return _.new_obj(s, s => {
            s.amount = math.chain(s.amount).subtract(fee).done();
            s.data.fee = "0";
            return s;
        });
    });
    const validators = [last_key.meta.validator, block.meta.validator];
    const gained = paid.map(s => {
        const i = validators.indexOf(s.owner);
        if (i === -1)
            return s;
        const gain = (() => {
            if (i === 0)
                return pre_fee;
            else if (i === 1)
                return next_fee;
            else
                return 0;
        })();
        return _.new_obj(s, s => {
            s.amount = math.chain(s.amount).add(gain).done();
            s.data.income = math.chain(Number(s.data.income || "0")).add(gain).done().toFixed(18);
            return s;
        });
    });
    const reduced = gained.map(s => {
        if (s.kind != "state" || s.token != con_1.constant.unit)
            return s;
        const reduce = Number(s.data.reduce || "1");
        return _.new_obj(s, s => {
            s.amount = math.chain(s.amount).multiply(reduce).done();
            s.data.reduce = "1";
            return s;
        });
    });
    return [reduced, LockData];
};
exports.AcceptMicroBlock = (block, chain, StateData, LockData) => {
    const first_data = [StateData, LockData];
    const txs = block.txs.map(pure => TxSet.pure_to_tx(pure, block));
    const txed = txs.reduce((data, tx, i) => {
        if (tx.meta.kind === "request")
            return TxSet.AcceptRequestTx(tx, block.meta.height, block.hash, i, data[0], data[1]);
        else if (tx.meta.kind === "refresh")
            return TxSet.AcceptRefreshTx(tx, chain, data[0], data[1]);
        else
            return data;
    }, first_data);
    const reduced = txed[0].map(s => {
        if (s.kind != "state" || s.token != con_1.constant.unit)
            return s;
        const reduce = Number(s.data.reduce || "1");
        return _.new_obj(s, s => {
            s.amount = math.chain(s.amount).multiply(reduce).done();
            s.data.reduce = "1";
            return s;
        });
    });
    return [reduced, txed[1]];
};
