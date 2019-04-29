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
const block_set = __importStar(require("./block"));
const data = __importStar(require("./data"));
const constant_1 = require("./constant");
const contracts = __importStar(require("./contract"));
const big_integer_1 = __importDefault(require("big-integer"));
const P = __importStar(require("p-iteration"));
exports.empty_tx = () => {
    const request = {
        type: 0,
        feeprice: "",
        gas: "",
        bases: [],
        input: [],
        log: ""
    };
    const refresh = {
        height: "",
        index: 0,
        success: 0,
        output: [],
        witness: [],
        nonce: "",
        gas_share: 0,
        unit_price: ""
    };
    const meta = {
        kind: 0,
        request: request,
        refresh: refresh
    };
    const add = {
        height: "",
        hash: "",
        index: 0
    };
    const hash = "";
    return {
        hash: hash,
        signature: [],
        meta: meta,
        additional: add
    };
};
exports.requested_check = async (base, trie, lock_db) => {
    return await P.some(base, async (key) => {
        const get = await data.read_from_trie(trie, lock_db, key, 1, lock_set.CreateLock(key));
        return get.state === 1;
    });
};
//require info about request-tx
exports.refreshed_check = async (base, trie, lock_db) => {
    return await P.some(base, async (key) => {
        const get = await data.read_from_trie(trie, lock_db, key, 1, lock_set.CreateLock(key));
        return get.state === 0;
    });
};
exports.state_check = (state) => {
    return _.address_form_check(state.owner) || _.slice_token_part(state.owner) != state.token;
};
exports.tx_meta2array = (meta) => {
    const req = meta.request;
    const ref = meta.refresh;
    const kind = "0" + meta.kind;
    const type = "0" + req.type.toString(16);
    let index = ref.index.toString(16);
    if (index.length % 2 != 0)
        index = "0" + index;
    const success = "0" + ref.success.toString(16);
    let gas_share = ref.gas_share.toString(16);
    if (gas_share.length % 2 != 0)
        gas_share = "0" + gas_share;
    return [kind, type, req.feeprice, req.gas, req.log, ref.height, index, success, ref.nonce, gas_share].concat(req.bases).concat(req.input).concat(ref.output).concat(ref.witness);
};
exports.tx_fee = (tx) => {
    const price = tx.meta.request.feeprice;
    const meta = tx.meta;
    const sign = tx.signature.map(s => s.data + s.v);
    const array = exports.tx_meta2array(meta).splice(2, 1).concat(tx.hash).concat(sign);
    const size_sum = array.reduce((sum, item) => {
        return sum.add(Math.ceil(Buffer.from(item, 'hex').length));
    }, big_integer_1.default(0));
    return size_sum.multiply(price).toString(16);
};
exports.unit_hash = async (request, height, block_hash, nonce, refresher, output, unit_price) => {
    return await crypto_set.compute_cryptonight(_.array2hash([request, height, block_hash, nonce, refresher, output, unit_price]));
};
/*export const find_req_tx = (ref_tx:T.Tx,chain:T.Block[]):T.Tx=>{
  const height = ref_tx.meta.height || 0;
  const block = chain[height] || BlockSet.empty_block();
  if(block.hash!=ref_tx.meta.block_hash) return empty_tx();
  const req_pure = block.txs[ref_tx.meta.index];
  if(req_pure==null) return empty_tx();
  const req_raw = block.raws[ref_tx.meta.index];
  if(req_raw==null) return empty_tx();
  return {
    hash:req_pure.hash,
    meta:req_pure.meta,
    raw:req_raw,
    additional:req_pure.additional
  }
}*/
const base_declaration_check = async (target, bases) => {
    return bases.indexOf(target.owner) === -1;
};
const output_change_check = async (bases, new_states) => {
    return P.some(new_states, async (s) => {
        return exports.state_check(s) || await base_declaration_check(s, bases);
    });
};
/*const output_create_check = (token_state:T.State,code:string,StateData:T.State[])=>{
  const getted:T.State = StateData.filter(s=>s.kind==="info"&&s.token===token_state.token)[0];
  if(getted!=null||token_state.nonce!=0||math.smaller(token_state.amount,0)||math.smaller(token_state.issued,0)||token_state.code!=_.toHash(code)) return true;
  else return false;
}*/
exports.find_req_tx = async (ref_tx, block_db) => {
    const height = ref_tx.meta.refresh.height;
    const index = ref_tx.meta.refresh.index;
    const block = await block_db.read_obj(height) || block_set.empty_block();
    const req_tx = block.txs[index] || exports.empty_tx();
    return req_tx;
};
exports.get_info_from_tx = (tx) => {
    const sign = tx.signature;
    const meta = tx.meta;
    const sign_data = sign.map(s => s.data);
    const meta_array = exports.tx_meta2array(meta);
    const recover_ids = sign.map(s => {
        return big_integer_1.default(s.v, 16).mod(2).toJSNumber();
    });
    const ids = sign.map((s, i) => {
        return big_integer_1.default(big_integer_1.default(s.v, 16).minus(9).minus(28 - recover_ids[i])).divide(2).toString(16);
    });
    const data_array = meta_array.concat(ids[0]);
    const meta_hash = _.array2hash(data_array);
    const pub_keys = sign_data.map((s, i) => {
        return crypto_set.recover(meta_hash, s, recover_ids[i]);
    });
    const address = crypto_set.generate_address(constant_1.constant.native, _.reduce_pub(pub_keys));
    const all_array = meta_array.concat(sign.map(s => s.v));
    return [meta_hash, all_array, ids, pub_keys, address];
};
exports.contract_check = async (token, bases, base_state, input_data, output_state, block_db, last_height) => {
    if (token === constant_1.constant.native) {
        return !contracts.native_verify(bases, base_state, input_data, output_state);
    }
    else if (token === constant_1.constant.unit && block_db != null && last_height != null) {
        return !contracts.unit_verify(bases, base_state, input_data, output_state, block_db, last_height);
    }
    else
        return true;
};
const verify_tx_basic = (hash, sign, meta_hash, infos, ids, pub_keys, address) => {
    const version = ids[0].slice(0, 4);
    const chain_id = ids[0].slice(4, 8);
    const net_id = ids[0].slice(8, 12);
    if (hash != _.array2hash(infos)) {
        //console.log("invalid hash");
        return false;
    }
    else if (ids.some(id => ids.indexOf(id) != 0)) {
        //console.log("invalid ids");
        return false;
    }
    else if (big_integer_1.default(version, 16).lesser(constant_1.constant.compatible_version)) {
        //console.log("different version");
        return false;
    }
    else if (big_integer_1.default(chain_id, 16).notEquals(constant_1.constant.my_chain_id)) {
        //console.log("different chain id");
        return false;
    }
    else if (big_integer_1.default(net_id, 16).notEquals(constant_1.constant.my_net_id)) {
        //console.log("different network id");
        return false;
    }
    else if (_.address_check(address, _.reduce_pub(pub_keys), constant_1.constant.native)) {
        //console.log("invalid address");
        return false;
    }
    else if (sign.length === 0 || sign.some((s, i) => _.sign_check(meta_hash, s.data, pub_keys[i]))) {
        //console.log("invalid signature");
        return false;
    }
    else {
        return true;
    }
};
exports.verify_req_tx = async (tx, trie, state_db, lock_db, disabling) => {
    const meta = tx.meta;
    const kind = meta.kind;
    const req = meta.request;
    const gas = req.gas;
    const other_bases = req.bases;
    const pulled = exports.get_info_from_tx(tx);
    const meta_hash = pulled[0];
    const infos = pulled[1];
    const ids = pulled[2];
    const pub_keys = pulled[3];
    const requester = pulled[4];
    const tokens = _.slice_tokens(other_bases);
    const sender = crypto_set.generate_address(tokens[0], _.reduce_pub(pub_keys));
    const bases = [sender].concat(other_bases);
    const requester_state = await data.read_from_trie(trie, state_db, requester, 0, state_set.CreateState("00", constant_1.constant.native, requester, "00", []));
    const base_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, state_db, key, 0, state_set.CreateState("00", _.slice_token_part(key), key, "00", []));
    });
    if ((disabling != null && disabling.indexOf(0) != -1) || !verify_tx_basic(tx.hash, tx.signature, meta_hash, infos, ids, pub_keys, requester)) {
        return false;
    }
    else if ((disabling != null && disabling.indexOf(1) != -1) || kind != 0) {
        //console.log("invalid kind");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(2) != -1) || requester_state == null || _.hashed_pub_check(requester, pub_keys) || requester_state.token != constant_1.constant.native || big_integer_1.default(requester_state.amount, 16).subtract(big_integer_1.default(exports.tx_fee(tx), 16)).subtract(big_integer_1.default(gas, 16)).lesser(0)) {
        //console.log("invalid requester");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(3) != -1) || tokens.length < 1 || tokens.length > 5) {
        //console.log("invalid token");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(4) != -1) || bases.some((key, i, array) => array.indexOf(key) != i) || base_states.some(s => tokens.indexOf(s.token) === -1) || bases.length != base_states.length) {
        //console.log("invalid base");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(5) != -1) || await exports.requested_check(bases, trie, lock_db)) {
        //console.log("base states are already requested");
        return false;
    }
    else {
        return true;
    }
};
exports.verify_ref_tx = async (tx, output_states, block_db, trie, state_db, lock_db, last_height, disabling) => {
    const meta = tx.meta;
    const kind = meta.kind;
    const ref = meta.refresh;
    const height = ref.height;
    const index = ref.index;
    const success = ref.success;
    const output = ref.output;
    const nonce = ref.nonce;
    const gas_share = ref.gas_share;
    const unit_price = ref.unit_price;
    const block = await block_db.read_obj(height) || block_set.empty_block();
    const pow_target = constant_1.constant.pow_target;
    const req_tx = block.txs[index];
    const gas = big_integer_1.default(req_tx.meta.request.gas, 16).multiply(gas_share).divide(100);
    const fee = big_integer_1.default(req_tx.meta.request.gas, 16).subtract(gas);
    const pulled = exports.get_info_from_tx(tx);
    const meta_hash = pulled[0];
    const infos = pulled[1];
    const ids = pulled[2];
    const pub_keys = pulled[3];
    const refresher = pulled[4];
    const refresher_state = await data.read_from_trie(trie, state_db, refresher, 0, state_set.CreateState("00", constant_1.constant.native, refresher));
    const unit_add = crypto_set.generate_address(constant_1.constant.unit, _.reduce_pub(pub_keys));
    const pull_from_req = exports.get_info_from_tx(req_tx);
    const requester = pull_from_req[4];
    const main_token = _.slice_token_part(req_tx.meta.request.bases[0]);
    const bases = [main_token + _.slice_hash_part(requester)].concat(req_tx.meta.request.bases);
    const base_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, state_db, key, 0, state_set.CreateState("00", _.slice_token_part(key), key, "00", []));
    });
    const base_states_hashes = base_states.map(s => _.array2hash([s.nonce, s.token, s.owner, s.amount].concat(s.data)));
    if ((disabling != null && disabling.indexOf(0) != -1) || !verify_tx_basic(tx.hash, tx.signature, meta_hash, infos, ids, pub_keys, refresher)) {
        return false;
    }
    else if ((disabling != null && disabling.indexOf(1) != -1) || kind != 1) {
        //console.log("invalid kind");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(2) != -1) || req_tx == null) {
        //console.log("invalid request hash");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(3) != -1) || !big_integer_1.default(await exports.unit_hash(req_tx.hash, height, block.hash, nonce, unit_add, _.array2hash(output), unit_price), 16).lesserOrEquals(pow_target)) {
        //console.log("invalid nonce");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(4) != -1) || exports.refreshed_check(bases, trie, lock_db)) {
        //console.log("base states are already refreshed");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(5) != -1) || refresher_state == null || _.hashed_pub_check(refresher, pub_keys) || big_integer_1.default(refresher_state.amount, 16).add(gas).subtract(fee).lesser(0)) {
        //console.log("invalid refresher");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(6) != -1) || output.some((o, i) => o != _.array2hash([output_states[i].nonce, output_states[i].token, output_states[i].owner, output_states[i].amount].concat(output_states[i].data)))) {
        //console.log("invalid output hash");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(7) != -1) || (success && req_tx.meta.request.type == 0 && (await output_change_check(bases, output_states) || await exports.contract_check(main_token, bases, base_states, req_tx.meta.request.input, output_states, block_db, last_height))) || (!success && (base_states_hashes.map((hash, i) => hash != output[i]) || gas_share != 0))) {
        //console.log("invalid output");
        return false;
    }
    else {
        return true;
    }
};
exports.create_req_tx = (type, bases, feeprice, gas, input, log) => {
    const empty = exports.empty_tx();
    const meta = {
        kind: 0,
        request: {
            type: type,
            feeprice: feeprice,
            gas: gas,
            bases: bases,
            input: input,
            log: log
        },
        refresh: empty.meta.refresh
    };
    const hash = _.array2hash(exports.tx_meta2array(meta));
    const tx = {
        hash: hash,
        signature: [],
        meta: meta,
        additional: empty.additional
    };
    return tx;
};
exports.create_ref_tx = (height, index, success, output, witness, nonce, gas_share, unit_price) => {
    const empty = exports.empty_tx();
    const meta = {
        kind: 1,
        request: empty.meta.request,
        refresh: {
            height: height,
            index: index,
            success: success,
            output: output,
            witness: witness,
            nonce: nonce,
            gas_share: gas_share,
            unit_price: unit_price
        }
    };
    const hash = _.array2hash(exports.tx_meta2array(meta));
    const tx = {
        hash: hash,
        signature: [],
        meta: meta,
        additional: empty.additional
    };
    return tx;
};
exports.sign_tx = (tx, private_key) => {
    const sign = crypto_set.sign(tx.hash, private_key);
    const recover_id = Number(sign[0]);
    const data = sign[1];
    const id = big_integer_1.default(("0000" + constant_1.constant.my_version).slice(-4) + ("0000" + constant_1.constant.my_chain_id).slice(-4) + ("0000" + constant_1.constant.my_net_id).slice(-4), 16).toJSNumber();
    const signature = {
        data: data,
        v: (id * 2 + 8 + 28 - recover_id).toString(16)
    };
    return _.new_obj(tx, tx => {
        tx.signature.push(signature);
        return tx;
    });
};
exports.accept_req_tx = async (tx, height, block_hash, index, trie, state_db, lock_db) => {
    const pulled = exports.get_info_from_tx(tx);
    const requester = pulled[4];
    const fee = exports.tx_fee(tx);
    const gas = tx.meta.request.gas;
    const requester_state = await data.read_from_trie(trie, state_db, requester, 0, state_set.CreateState("00", constant_1.constant.native, requester, "00"));
    const changed_states = contracts.req_tx_change([requester_state], requester, fee, gas);
    const bases = tx.meta.request.bases.concat(requester).filter((val, i, array) => array.indexOf(val) === i);
    const base_states = await P.map(bases, async (key) => {
        if (key === requester)
            return changed_states[0];
        return await data.read_from_trie(trie, state_db, key, 0, state_set.CreateState("00", constant_1.constant.native, key, "00"));
    });
    const lock_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, lock_db, key, 1, lock_set.CreateLock(key));
    });
    const added = lock_states.map(l => {
        return _.new_obj(l, l => {
            l.state = 1;
            l.height = height;
            l.block_hash = block_hash;
            l.index = index;
            l.tx_hash = tx.hash;
            return l;
        });
    });
    await P.forEach(bases, async (key, i) => {
        await data.write_trie(trie, state_db, lock_db, base_states[i], added[i]);
    });
};
exports.accept_ref_tx = async (ref_tx, height, block_hash, index, trie, state_db, lock_db, block_db) => {
    const req_tx = await exports.find_req_tx(ref_tx, block_db);
    const requester = exports.get_info_from_tx(req_tx)[4];
    const refresher = exports.get_info_from_tx(ref_tx)[4];
    const gas = big_integer_1.default(req_tx.meta.request.gas, 16).multiply(ref_tx.meta.refresh.gas_share).divide(100).toString(16);
    const fee = big_integer_1.default(req_tx.meta.request.gas, 16).subtract(big_integer_1.default(gas, 16)).toString(16);
    const bases = [requester, refresher].concat(req_tx.meta.request.bases);
    const base_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, state_db, key, 0, state_set.CreateState("00", _.slice_token_part(key), key, "00", []));
    });
    const changed = await contracts.ref_tx_change(bases, base_states, requester, refresher, fee, gas, height);
    const lock_states = await P.map(bases, async (key) => {
        return await data.read_from_trie(trie, lock_db, key, 1, lock_set.CreateLock(key));
    });
    const added = lock_states.map(l => {
        return _.new_obj(l, l => {
            l.state = 0;
            l.height = height;
            l.block_hash = block_hash;
            l.index = index;
            l.tx_hash = ref_tx.hash;
            return l;
        });
    });
    await P.forEach(bases, async (key, i) => {
        await data.write_trie(trie, state_db, lock_db, changed[i], added[i]);
    });
};
