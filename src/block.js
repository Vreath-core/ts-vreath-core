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
const _ = __importStar(require("./util"));
const crypto_set = __importStar(require("./crypto_set"));
const state_set = __importStar(require("./state"));
const lock_set = __importStar(require("./lock"));
const tx_set = __importStar(require("./tx"));
const diff_1 = require("./diff");
const data = __importStar(require("./data"));
const constant_1 = require("./constant");
const contract = __importStar(require("./contract"));
const big_integer_1 = __importDefault(require("big-integer"));
const P = __importStar(require("p-iteration"));
exports.empty_block = () => {
    const meta = {
        kind: 0,
        height: "",
        previoushash: "",
        timestamp: 0,
        pos_diff: "",
        trie_root: "",
        tx_root: "",
        fee_sum: "",
        extra: ""
    };
    const hash = "";
    const sign = {
        data: "",
        v: ""
    };
    return {
        hash: hash,
        signature: sign,
        meta: meta,
        txs: [],
    };
};
exports.block_meta2array = (meta) => {
    const kind = "0" + meta.kind.toString(16);
    return [kind, meta.height, meta.previoushash, meta.timestamp.toString(16), meta.pos_diff, meta.trie_root, meta.tx_root, meta.extra];
};
exports.get_info_from_block = (block) => {
    const sign = block.signature;
    const meta_data = exports.block_meta2array(block.meta);
    const recover_id = big_integer_1.default(sign.v, 16).mod(2).toJSNumber();
    const id = ("000000000000" + _.bigInt2hex(big_integer_1.default(big_integer_1.default(sign.v, 16).minus(8).minus(28 - recover_id)).divide(2))).slice(-12);
    const raw_array = meta_data.concat(id);
    const meta_hash = _.array2hash(raw_array);
    const public_key = crypto_set.recover(meta_hash, sign.data, recover_id);
    const address = crypto_set.generate_address(constant_1.constant.native, public_key);
    const all_array = raw_array.concat(sign.v);
    return [meta_hash, all_array, id, public_key, address];
};
exports.search_key_block = async (block_db, last_height) => {
    let height = last_height;
    let block = exports.empty_block();
    while (1) {
        block = await block_db.read_obj(height);
        if (block == null)
            continue;
        if (block.meta.kind === 0)
            break;
        else if (height === "00")
            break;
        else {
            height = _.bigInt2hex(big_integer_1.default(height, 16).subtract(1));
        }
    }
    return block;
};
exports.search_micro_block = async (block_db, key_block, last_height) => {
    const key_public = exports.get_info_from_block(key_block)[4];
    let height = key_block.meta.height;
    let block;
    let public_key;
    let micros = [];
    while (1) {
        block = await block_db.read_obj(height);
        if (block == null)
            continue;
        public_key = exports.get_info_from_block(block)[4];
        if (block.meta.kind === 1 && public_key === key_public)
            micros.push(block);
        if (height === last_height)
            break;
        height = _.bigInt2hex(big_integer_1.default(height, 16).add(1));
    }
    return micros;
};
exports.GetTreeroot = (pre) => {
    if (pre.length == 0)
        return [crypto_set.get_sha256("")];
    else if (pre.length == 1)
        return pre;
    else {
        const union = pre.reduce((result, val, index, array) => {
            const i = Number(index);
            if (i % 2 == 0) {
                const left = val;
                const right = ((left, i, array) => {
                    if (array[i + 1] == null)
                        return crypto_set.get_sha256("");
                    else
                        return array[i + 1];
                })(left, i, array);
                return result.concat(crypto_set.get_sha256(left + right));
            }
            else
                return result;
        }, []);
        return exports.GetTreeroot(union);
    }
};
exports.tx_fee_sum = (txs) => {
    const sum = txs.reduce((sum, tx) => sum.add(big_integer_1.default(tx_set.tx_fee(tx), 16)), big_integer_1.default(0));
    return _.bigInt2hex(sum);
};
exports.pos_hash = (previoushash, address, timestamp) => {
    return _.array2hash([previoushash, address, timestamp.toString(16)]);
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
exports.txs_check = async (block, output_states, block_db, trie, state_db, lock_db, last_height) => {
    const txs = block.txs;
    const all_bases = txs.reduce((res, tx) => {
        return res.concat(tx.meta.request.bases);
    }, []);
    let length_sum = 0;
    if (all_bases.some((val, i, array) => array.indexOf(val) != i))
        return true;
    const addtionals = txs.map((tx, i) => {
        return {
            height: block.meta.height,
            hash: block.hash,
            index: i
        };
    });
    if (txs.some((tx, i) => {
        const add = addtionals[i];
        return big_integer_1.default(tx.additional.height, 16).notEquals(big_integer_1.default(add.height, 16)) || tx.additional.hash != add.hash || tx.additional.index != add.index;
    }))
        return true;
    return await P.some(txs, async (tx) => {
        if (tx.meta.kind === 0) {
            return await tx_set.verify_req_tx(tx, trie, state_db, lock_db) === false;
        }
        else if (tx.meta.kind === 1) {
            const output = output_states.slice(length_sum, length_sum + tx.meta.refresh.output.length);
            length_sum = length_sum + tx.meta.refresh.output.length;
            return await tx_set.verify_ref_tx(tx, output, block_db, trie, state_db, lock_db, last_height) === false;
        }
        else
            return true;
    });
};
exports.compute_block_size = (block) => {
    const meta_array = exports.block_meta2array(block.meta);
    const signs = [block.signature.data, block.signature.v];
    const txs = block.txs.reduce((res, tx) => {
        const meta = tx.meta;
        const sign = tx.signature.map(s => s.data + s.v);
        const array = tx_set.tx_meta2array(meta).concat(tx.hash).concat(sign);
        return res.concat(array);
    }, []);
    const all_array = meta_array.concat(block.hash).concat(signs).concat(txs);
    const tx_fee_sum = _.bigInt2hex(all_array.reduce((sum, item) => sum.add(Math.ceil(Buffer.from(item, 'hex').length)), big_integer_1.default(0)));
    return tx_fee_sum;
};
exports.verify_key_block = async (block, block_db, trie, state_db, last_height) => {
    const hash = block.hash;
    const sign = block.signature;
    const meta = block.meta;
    const kind = meta.kind;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const trie_root = meta.trie_root;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;
    const info = exports.get_info_from_block(block);
    const meta_hash = info[0];
    const all_array = info[1];
    const id = info[2];
    const validator_pub = info[3];
    const unit_validator = crypto_set.generate_address(constant_1.constant.unit, validator_pub);
    const unit_validator_state = await data.read_from_trie(trie, state_db, unit_validator, 0, state_set.CreateState("00", unit_validator, constant_1.constant.unit, "00", ["01", "00"]));
    const pre_height = unit_validator_state.data[1];
    const reduce = big_integer_1.default.max(big_integer_1.default(block.meta.height, 16).subtract(big_integer_1.default(pre_height, 16)), big_integer_1.default(1));
    const reduced_amount = (() => {
        const computed = big_integer_1.default(unit_validator_state.amount, 16).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
        if (computed.lesser(1))
            return _.bigInt2hex(big_integer_1.default("00"));
        else
            return _.bigInt2hex(computed);
    })();
    const right_diff = await diff_1.get_diff(block_db, last_height);
    const hash_for_pos = exports.pos_hash(previoushash, unit_validator, timestamp);
    const last = await block_db.read_obj(last_height) || exports.empty_block();
    const right_previoushash = last.hash;
    const right_trie_root = trie.now_root();
    if (hash != _.array2hash(all_array) || !big_integer_1.default(hash_for_pos, 16).lesserOrEquals(big_integer_1.default(2).pow(256).multiply(big_integer_1.default(reduced_amount, 16)).divide(big_integer_1.default(right_diff, 16)))) {
        //console.log("invalid hash");
        return false;
    }
    else if (_.sign_check(meta_hash, sign.data, validator_pub)) {
        //console.log("invalid validator signature");
        return false;
    }
    else if (kind != 0) {
        //console.log("invalid kind");
        return false;
    }
    else if (big_integer_1.default(id.slice(0, 4), 16).lesser(constant_1.constant.my_version)) {
        //console.log("invalid version");
        return false;
    }
    else if (id.slice(4, 8) != constant_1.constant.my_chain_id) {
        //console.log("invalid chain id");
        return false;
    }
    else if (id.slice(8, 12) != constant_1.constant.my_net_id) {
        //console.log("invalid network id");
        return false;
    }
    else if (big_integer_1.default(height, 16).notEquals(big_integer_1.default(last_height, 16).add(1))) {
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
    else if (trie_root != right_trie_root) {
        //console.log("invalid trie_root");
        return false;
    }
    else if (tx_root != crypto_set.get_sha256("")) {
        //console.log("invalid tx_root");
        return false;
    }
    else if (fee_sum != "00") {
        //console.log("invalid fee_sum");
        return false;
    }
    else if (txs.length > 0) {
        //console.log("invalid txs");
        return false;
    }
    else if (!big_integer_1.default(exports.compute_block_size(block), 16).lesserOrEquals(constant_1.constant.block_size)) {
        //console.log("too big block");
        return false;
    }
    else {
        return true;
    }
};
exports.verify_micro_block = async (block, output_states, block_db, trie, state_db, lock_db, last_height) => {
    const hash = block.hash;
    const sign = block.signature;
    const meta = block.meta;
    const kind = meta.kind;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const trie_root = meta.trie_root;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;
    const info = exports.get_info_from_block(block);
    const meta_hash = info[0];
    const all_array = info[1];
    const id = info[2];
    const validator_pub = info[3];
    const tx_roots = txs.map(t => t.hash);
    const date = new Date();
    const now = Math.floor(date.getTime() / 1000);
    const key_block = await exports.search_key_block(block_db, last_height) || exports.empty_block();
    const key_block_public = exports.get_info_from_block(key_block)[3];
    const already_micro = await exports.search_micro_block(block_db, key_block, last_height);
    const last = await block_db.read_obj(last_height) || exports.empty_block();
    const right_previoushash = last.hash;
    const right_trie_root = trie.now_root();
    const tx_tokens = txs.map(tx => {
        const sliced = tx.meta.request.bases.map(key => _.slice_token_part(key));
        return sliced.filter((val, i, array) => array.indexOf(val) === i);
    });
    const unit_buying_tokens_hash = _.array2hash([("0000000000000000" + constant_1.constant.unit).slice(-16), ("0000000000000000" + constant_1.constant.native).slice(-12)]);
    if (hash != _.array2hash(all_array)) {
        //console.log("invalid hash");
        return false;
    }
    else if (validator_pub != key_block_public) {
        //console.log("invalid validator");
        return false;
    }
    else if (_.sign_check(meta_hash, sign.data, validator_pub)) {
        //console.log("invalid validator signature");
        return false;
    }
    else if (kind != 1) {
        //console.log("invalid kind");
        return false;
    }
    else if (big_integer_1.default(id.slice(0, 4), 16).lesser(constant_1.constant.my_version)) {
        //console.log("invalid version");
        return false;
    }
    else if (id.slice(4, 8) != constant_1.constant.my_chain_id) {
        //console.log("invalid chain id");
        return false;
    }
    else if (id.slice(8, 12) != constant_1.constant.my_net_id) {
        //console.log("invalid network id");
        return false;
    }
    else if (big_integer_1.default(height, 16).notEquals(big_integer_1.default(last_height, 16).add(1))) {
        //console.log("invalid height");
        return false;
    }
    else if (previoushash != right_previoushash) {
        //console.log("invalid parenthash");
        return false;
    }
    else if (timestamp.toString().length != 10 || _.time_check(timestamp) || now - last.meta.timestamp < constant_1.constant.block_time) {
        //console.log("invalid timestamp");
        return false;
    }
    else if (pos_diff != key_block.meta.pos_diff) {
        //console.log("invalid pos_diff");
        return false;
    }
    else if (trie_root != right_trie_root) {
        //console.log("invalid trie_root");
        return false;
    }
    else if (tx_root != exports.GetTreeroot(tx_roots)[0]) {
        //console.log("invalid tx_root");
        return false;
    }
    else if (fee_sum != exports.tx_fee_sum(txs)) {
        //console.log("invalid fee_sum");
        return false;
    }
    else if (!big_integer_1.default(exports.compute_block_size(block), 16).lesserOrEquals(constant_1.constant.block_size)) {
        //console.log("too big block");
        return false;
    }
    else if (already_micro.length > constant_1.constant.max_blocks) {
        //console.log("too many micro blocks");
        return false;
    }
    else if (await exports.txs_check(block, output_states, block_db, trie, state_db, lock_db, last_height)) {
        //console.log("invalid txs");
        return false;
    }
    else if ((big_integer_1.default(height, 16).mod(3).eq(0) && txs.some((tx, i) => tx.meta.kind === 0 && _.array2hash(tx_tokens[i]) != unit_buying_tokens_hash || (big_integer_1.default(height, 16).mod(3).notEquals(0) && txs.some((tx, i) => tx.meta.kind === 0 && _.array2hash(tx_tokens[i]) === unit_buying_tokens_hash))))) {
        //console.log("invalid kind of txs")
        return false;
    }
    else {
        return true;
    }
};
exports.create_key_block = async (private_key, block_db, last_height, trie, state_db, extra) => {
    const empty = exports.empty_block();
    const new_height = _.bigInt2hex(big_integer_1.default(last_height, 16).add(1));
    const last = await block_db.read_obj(last_height) || empty;
    const previoushash = last.hash;
    const pos_diff = await diff_1.get_diff(block_db, last_height);
    const trie_root = trie.now_root();
    const date = new Date();
    const timestamp = Math.floor(date.getTime() / 1000);
    const meta = {
        kind: 0,
        height: new_height,
        previoushash: previoushash,
        timestamp: timestamp,
        pos_diff: pos_diff,
        trie_root: trie_root,
        tx_root: crypto_set.get_sha256(''),
        fee_sum: "00",
        extra: extra
    };
    const id = constant_1.constant.my_version + constant_1.constant.my_chain_id + constant_1.constant.my_net_id;
    const meta_array = exports.block_meta2array(meta).concat(id);
    const meta_hash = _.array2hash(meta_array);
    const signed = crypto_set.sign(meta_hash, private_key);
    const v = _.bigInt2hex(big_integer_1.default(id, 16).multiply(2).add(8).add(big_integer_1.default(28).subtract(big_integer_1.default(signed[0], 16))));
    const sign = {
        data: signed[1],
        v: v
    };
    const all_array = meta_array.concat(sign.v);
    const hash = _.array2hash(all_array);
    return {
        hash: hash,
        signature: sign,
        meta: meta,
        txs: [],
    };
};
exports.create_micro_block = async (private_key, block_db, last_height, trie, txs, extra) => {
    const empty = exports.empty_block();
    const last = await block_db.read_obj(last_height) || empty;
    const new_height = _.bigInt2hex(big_integer_1.default(last_height, 16).add(1));
    const previoushash = last.hash;
    const key = await exports.search_key_block(block_db, last_height) || exports.empty_block();
    const date = new Date();
    const timestamp = Math.floor(date.getTime() / 1000);
    const trie_root = trie.now_root();
    const tx_root = exports.GetTreeroot(txs.map(t => t.hash))[0];
    const fee_sum = exports.tx_fee_sum(txs);
    const meta = {
        kind: 1,
        height: new_height,
        previoushash: previoushash,
        timestamp: timestamp,
        pos_diff: key.meta.pos_diff,
        trie_root: trie_root,
        tx_root: tx_root,
        fee_sum: fee_sum,
        extra: extra
    };
    const id = constant_1.constant.my_version + constant_1.constant.my_chain_id + constant_1.constant.my_net_id;
    const meta_array = exports.block_meta2array(meta).concat(id);
    const meta_hash = _.array2hash(meta_array);
    const signed = crypto_set.sign(meta_hash, private_key);
    const v = _.bigInt2hex(big_integer_1.default(id, 16).multiply(2).add(8).add(big_integer_1.default(28).subtract(big_integer_1.default(signed[0], 16))));
    const sign = {
        data: signed[1],
        v: v
    };
    const all_array = meta_array.concat(sign.v);
    const hash = _.array2hash(all_array);
    return {
        hash: hash,
        signature: sign,
        meta: meta,
        txs: txs,
    };
};
const compute_issue = (height) => {
    const all_issue = constant_1.constant.all_issue;
    const cycle = constant_1.constant.cycle;
    const n = big_integer_1.default(height, 16).divide(cycle);
    const new_amount = big_integer_1.default(all_issue, 16).divide(big_integer_1.default(2).pow(n.add(1)));
    const pre_amount = big_integer_1.default(all_issue, 16).divide(big_integer_1.default(2).pow(n));
    const issue = pre_amount.subtract(new_amount).divide(cycle);
    if (issue.lesser(1))
        return "00";
    else
        return _.bigInt2hex(issue);
};
exports.accept_key_block = async (block, block_db, last_height, trie, state_db, lock_db) => {
    const last_key = await exports.search_key_block(block_db, last_height) || exports.empty_block();
    const last_micros = await exports.search_micro_block(block_db, last_key, last_height);
    const pre_pulled = exports.get_info_from_block(last_key);
    const new_pulled = exports.get_info_from_block(block);
    const pre_native = pre_pulled[4];
    const new_native = new_pulled[4];
    const pre_unit = crypto_set.generate_address(constant_1.constant.unit, pre_pulled[3]);
    const new_unit = crypto_set.generate_address(constant_1.constant.unit, new_pulled[3]);
    const tx_bases = last_micros.reduce((res, block) => {
        return res.concat(block.txs.map(tx => {
            return tx_set.get_info_from_tx(tx)[4];
        }));
    }, []);
    const bases = tx_bases.concat(pre_native).concat(new_native).concat(pre_unit).concat(new_unit).filter((val, i, array) => array.indexOf(val) === i);
    const base_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, state_db, key, 0, state_set.CreateState("00", _.slice_token_part(key), key));
    });
    const fees = last_micros.reduce((sum, b) => big_integer_1.default(sum).add(b.meta.fee_sum), big_integer_1.default(0));
    const issues = last_micros.concat(last_key).reduce((sum, b) => sum.add(big_integer_1.default(compute_issue(b.meta.height), 16)), big_integer_1.default(0));
    const fee_sum = _.bigInt2hex(fees.add(issues));
    const changed = contract.key_block_change(base_states, pre_native, new_native, fee_sum, block.meta.height);
    const lock_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, lock_db, key, 1, lock_set.CreateLock(key));
    });
    await P.forEach(bases, async (key, i) => {
        await data.write_trie(trie, state_db, lock_db, changed[i], lock_states[i]);
    });
};
exports.accept_micro_block = async (block, output_states, block_db, trie, state_db, lock_db) => {
    let length_sum = 0;
    await P.forEach(block.txs, async (tx, i) => {
        if (tx.meta.kind === 0)
            await tx_set.accept_req_tx(tx, block.meta.height, block.hash, i, trie, state_db, lock_db);
        else if (tx.meta.kind === 1) {
            const output = output_states.slice(length_sum, length_sum + tx.meta.refresh.output.length);
            length_sum = length_sum + tx.meta.refresh.output.length;
            await tx_set.accept_ref_tx(tx, output, block.meta.height, block.hash, i, trie, state_db, lock_db, block_db);
        }
    });
    const public_key = exports.get_info_from_block(block)[3];
    const unit_validator = crypto_set.generate_address(constant_1.constant.unit, public_key);
    const unit_state = await data.read_from_trie(trie, state_db, unit_validator, 0, state_set.CreateState("00", constant_1.constant.unit, unit_validator, "00", ["01", "00"]));
    const changed = contract.micro_block_change([unit_state], block.meta.height);
    const lock_state = await data.read_from_trie(trie, lock_db, unit_validator, 1, lock_set.CreateLock(unit_validator));
    await data.write_trie(trie, state_db, lock_db, changed[0], lock_state);
};
