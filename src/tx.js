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
        height: 0,
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
exports.requested_check = async (base, L_Trie) => {
    return await P.some(base, async (key) => {
        const get = await L_Trie.get(key);
        if (get == null)
            return false;
        else if (get.state === 0)
            return false;
        else
            return true;
    });
};
//require info about request-tx
exports.refreshed_check = async (base, L_Trie) => {
    return await P.some(base, async (key) => {
        const get = await L_Trie.get(key);
        if (get == null)
            return false;
        else if (get.state === 0)
            return true;
        else
            return false;
    });
};
exports.state_check = (state) => {
    return _.address_form_check(state.owner) || '0x' + _.slice_token_part(state.owner) != state.token;
};
const tx_meta2array = (meta) => {
    const req = meta.request;
    const ref = meta.refresh;
    return [meta.kind, req.type, req.gas, req.log, ref.height, ref.index, ref.success, ref.nonce, ref.gas_share].concat(req.bases).concat(req.input).concat(ref.output).concat(ref.witness).map(item => {
        if (typeof item != 'string')
            return '0x' + item.toString(16);
        else if (item.slice(0, 2) != '0x')
            return '0x' + item;
        else
            return item;
    });
};
exports.tx_fee = (tx) => {
    const price = tx.meta.request.feeprice;
    const meta = tx.meta;
    const array = tx_meta2array(meta);
    const size_sum = array.reduce((sum, item) => {
        return sum.add(Math.ceil(Buffer.from(item, 'hex').length));
    }, big_integer_1.default(0));
    return '0x' + size_sum.multiply(price).toString(16);
};
exports.unit_hash = async (request, height, block_hash, nonce, refresher, output, unit_price) => {
    return await crypto_set.compute_cryptonight('0x' + big_integer_1.default(request).add(height).add('0x' + block_hash).add(nonce).add(refresher).add('0x' + output).add(unit_price).toString(16));
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
const base_declaration_check = async (target, bases, S_Trie) => {
    const get = await S_Trie.get(target.owner);
    return get != null && bases.indexOf(target.owner) === -1;
};
const output_change_check = async (bases, new_states, S_Trie) => {
    return P.some(new_states, async (s) => {
        return exports.state_check(s) || await base_declaration_check(s, bases, S_Trie);
    });
};
/*const output_create_check = (token_state:T.State,code:string,StateData:T.State[])=>{
  const getted:T.State = StateData.filter(s=>s.kind==="info"&&s.token===token_state.token)[0];
  if(getted!=null||token_state.nonce!=0||math.smaller(token_state.amount,0)||math.smaller(token_state.issued,0)||token_state.code!=_.toHash(code)) return true;
  else return false;
}*/
const get_info_from_tx = (tx) => {
    const sign = tx.signature;
    const meta = tx.meta;
    const sign_data = sign.map(s => s.data);
    const meta_array = tx_meta2array(meta);
    const recover_ids = sign.map(s => {
        return s.v % 2;
    });
    const chain_ids = sign.map((s, i) => {
        return (s.v - 8 - (28 - recover_ids[i])) / 2;
    });
    const data_array = meta_array.concat('0x' + chain_ids[0].toString(16));
    const meta_hash = crypto_set.get_sha256(_.hex_sum(data_array));
    const pub_keys = sign_data.map((s, i) => {
        return crypto_set.recover(meta_hash, s, recover_ids[i]);
    });
    const address = crypto_set.generate_address(constant_1.constant.native, _.reduce_pub(pub_keys));
    const all_array = meta_array.concat(sign.map(s => '0x' + s.v.toString(16)));
    return [meta_hash, all_array, chain_ids, pub_keys, address];
};
const verify_tx_basic = (hash, sign, meta_hash, infos, chain_ids, pub_keys, address) => {
    if (hash != crypto_set.get_sha256(_.hex_sum(infos))) {
        //console.log("invalid hash");
        return false;
    }
    else if (chain_ids[0] != constant_1.constant.my_chain_id || chain_ids.some(id => chain_ids.indexOf(id) != 0)) {
        //console.log("different version");
        return false;
    }
    /*else if(network_id!=constant.my_net_id){
      //console.log("different network id");
      return false;
    }*/
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
exports.verify_req_tx = async (tx, S_Trie, L_Trie, disabling) => {
    const meta = tx.meta;
    const kind = meta.kind;
    const req = meta.request;
    const ref = meta.refresh;
    const gas = req.gas;
    const other_bases = req.bases;
    const pulled = get_info_from_tx(tx);
    const meta_hash = pulled[0];
    const infos = pulled[1];
    const chain_ids = pulled[2];
    const pub_keys = pulled[3];
    const requester = pulled[4];
    const tokens = _.slice_tokens(other_bases);
    const sender = crypto_set.generate_address(tokens[0], _.reduce_pub(pub_keys));
    const bases = [sender].concat(other_bases);
    const requester_state = await S_Trie.get(requester);
    const base_states = await P.map(bases, async (key) => {
        return await S_Trie.get(key) || state_set.CreateState("0x00000000", '0x' + _.slice_token_part(key), key, "0x0000000000", []);
    });
    const empty_ref = exports.empty_tx().meta.refresh;
    if ((disabling != null && disabling.indexOf(0) != -1) || !verify_tx_basic(tx.hash, tx.signature, meta_hash, infos, chain_ids, pub_keys, requester)) {
        return false;
    }
    else if ((disabling != null && disabling.indexOf(1) != -1) || kind != 0) {
        //console.log("invalid kind");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(2) != -1) || requester_state == null || _.hashed_pub_check(requester, pub_keys) || requester_state.token != '0x' + constant_1.constant.native || big_integer_1.default(requester_state.amount).subtract(exports.tx_fee(tx)).subtract(gas).lesser(0) || await exports.requested_check([requester], L_Trie)) {
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
    else if ((disabling != null && disabling.indexOf(5) != -1) || await exports.requested_check(bases, L_Trie)) {
        //console.log("base states are already requested");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(6) != -1) || ref.height != empty_ref.height || ref.index != empty_ref.index || ref.success != empty_ref.success || ref.output.length != 0 || ref.witness.length != 0 || ref.nonce != empty_ref.nonce || ref.gas_share != empty_ref.gas_share || ref.unit_price != empty_ref.unit_price) {
        //console.log("invalid refresh part");
        return false;
    }
    else {
        return true;
    }
};
exports.verify_ref_tx = async (tx, output_states, block_db, S_Trie, L_Trie, disabling) => {
    const meta = tx.meta;
    const kind = meta.kind;
    const req = meta.request;
    const ref = meta.refresh;
    const height = ref.height;
    const index = ref.index;
    const success = ref.success;
    const output = ref.output;
    const nonce = ref.nonce;
    const gas_share = ref.gas_share;
    const unit_price = ref.unit_price;
    const block = JSON.parse(await block_db.get(height)) || block_set.empty_block();
    const pow_target = constant_1.constant.pow_target;
    const req_tx = block.txs[index];
    const gas = big_integer_1.default(req_tx.meta.request.gas).multiply(gas_share);
    const fee = big_integer_1.default(req_tx.meta.request.gas).subtract(gas);
    const pulled = get_info_from_tx(tx);
    const meta_hash = pulled[0];
    const infos = pulled[1];
    const chain_ids = pulled[2];
    const pub_keys = pulled[3];
    const refresher = pulled[4];
    const refresher_state = await S_Trie.get(refresher);
    const unit_add = crypto_set.generate_address(constant_1.constant.unit, _.reduce_pub(pub_keys));
    const pull_from_req = get_info_from_tx(req_tx);
    const bases = [pull_from_req[4]].concat(req_tx.meta.request.bases);
    const base_states = await P.map(bases, async (key) => {
        return await S_Trie.get(key) || state_set.CreateState("0x00000000", '0x' + _.slice_token_part(key), key, "0x0000000000", []);
    });
    const base_states_hashes = base_states.map(s => crypto_set.get_sha256(_.hex_sum([s.nonce, s.token, s.owner, s.amount].concat(s.data))));
    /*bases.map(key=>{
      return StateData.filter(s=>s.kind==="state"&&req_tx.meta.tokens.indexOf(s.token)!=-1&&s.owner===key)[0] || StateSet.CreateState();
    });*/
    const empty_req = exports.empty_tx().meta.request;
    if ((disabling != null && disabling.indexOf(0) != -1) || !verify_tx_basic(tx.hash, tx.signature, meta_hash, infos, chain_ids, pub_keys, refresher)) {
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
    else if ((disabling != null && disabling.indexOf(3) != -1) || !big_integer_1.default(await exports.unit_hash(req_tx.hash, height, block.hash, nonce, unit_add, crypto_set.get_sha256(_.hex_sum(output)), unit_price)).lesserOrEquals(pow_target)) {
        //console.log("invalid nonce");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(4) != -1) || exports.refreshed_check(bases, L_Trie)) {
        //console.log("base states are already refreshed");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(5) != -1) || refresher_state == null || _.hashed_pub_check(refresher, pub_keys) || big_integer_1.default(refresher_state.amount).add(gas).subtract(fee).lesser(0)) {
        //console.log("invalid refresher");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(6) != -1) || output.some((o, i) => o != crypto_set.get_sha256(_.hex_sum([output_states[i].nonce, output_states[i].token, output_states[i].owner, output_states[i].amount].concat(output_states[i].data))))) {
        //console.log("invalid output hash");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(7) != -1) || (success && req_tx.meta.request.type == 0 && await output_change_check(bases, output_states, S_Trie)) || (!success && base_states_hashes.map((hash, i) => hash != output[i]))) {
        //console.log("invalid output");
        return false;
    }
    else if ((disabling != null && disabling.indexOf(7) != -1) || req.type != empty_req.type || req.feeprice != empty_req.feeprice || req.gas != empty_req.gas || req.bases.length != 0 || req.input.length != 0 || req.log != empty_req.log) {
        //console.log("invalid request part");
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
    const hash = crypto_set.get_sha256(_.hex_sum(tx_meta2array(meta)));
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
    const hash = crypto_set.get_sha256(_.hex_sum(tx_meta2array(meta)));
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
    const recover_id = sign[0];
    const data = sign[1];
    const signature = {
        data: data,
        v: constant_1.constant.my_chain_id * 2 + 8 + 28 - recover_id
    };
    return _.new_obj(tx, tx => {
        tx.signature.push(signature);
        return tx;
    });
};
exports.accept_req_tx = async (tx, height, block_hash, index, trie, state_db, lock_db) => {
    const pulled = get_info_from_tx(tx);
    const requester = pulled[4];
    const fee = exports.tx_fee(tx);
    const gas = tx.meta.request.gas;
    const requester_state = await data.read_from_trie(trie, state_db, requester, 0, state_set.CreateState("0x0", constant_1.constant.native, requester, "0x0"));
    const changed_states = contracts.req_tx_change([requester_state], requester, fee, gas);
    const bases = tx.meta.request.bases.concat(requester).filter((val, i, array) => array.indexOf(val) === i);
    const base_states = await P.map(bases, async (key) => {
        if (key === requester)
            return changed_states[0];
        return await data.read_from_trie(trie, state_db, key, 0, state_set.CreateState("0x0", constant_1.constant.native, key, "0x0"));
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
        await data.write2trie(trie, state_db, lock_db, base_states[i], added[i]);
    });
};
exports.accept_ref_tx = (ref_tx, chain, StateData, LockData) => {
    const native = constant_1.constant.native;
    const unit = constant_1.constant.unit;
    const req_tx = find_req_tx(ref_tx, chain);
    const requester = CryptoSet.GenerateAddress(native, _.reduce_pub(req_tx.meta.pub_key));
    const refresher = CryptoSet.GenerateAddress(native, _.reduce_pub(ref_tx.meta.pub_key));
    const fee = exports.tx_fee(ref_tx);
    const gas = req_tx.meta.gas;
    const unit_reduce = math.pow(constant_1.constant.unit_rate, chain.length - ref_tx.meta.height);
    const added = LockData.map(l => {
        const index = req_tx.meta.bases.indexOf(l.address);
        if (index != -1) {
            return _.new_obj(l, l => {
                l.state = "yet";
                return l;
            });
        }
        else
            return l;
    });
    if (req_tx.meta.type === "create") {
        const token_info = JSON.parse(req_tx.raw.raw[0]);
        const created = StateData.map(s => {
            if (s.kind === "info" && s.token === token_info.token)
                return token_info;
            else
                return s;
        });
        const reqed = created.map(s => {
            if (s.kind != "state" || s.owner != requester)
                return s;
            return _.new_obj(s, s => {
                s.data.gas = "0";
                s.amount = math.chain(s.amount).subtract(gas).done();
                return s;
            });
        });
        const refed = reqed.map(s => {
            if (s.kind != "state" || s.owner != refresher)
                return s;
            return _.new_obj(s, s => {
                s.amount = math.chain(s.amount).add(gas).done();
                if (s.data.fee == null)
                    s.data.fee = fee.toFixed(18);
                else
                    s.data.fee = math.chain(Number(s.data.fee || "0")).add(fee).done().toFixed(18);
                return s;
            });
        });
        const gained = refed.map(s => {
            const income = Number(s.data.income || "0");
            if (income === 0)
                return s;
            return _.new_obj(s, s => {
                s.amount = math.chain(s.amount).add(income).done();
                s.data.income = "0";
                return s;
            });
        });
        const reduced = gained.map(s => {
            if (s.kind != "state" || s.token != constant_1.constant.unit || req_tx.meta.bases.indexOf(s.owner) === -1)
                return s;
            return _.new_obj(s, s => {
                s.amount = math.chain(s.amount).multiply(unit_reduce).done();
                return s;
            });
        });
        return [reduced, added];
    }
    else {
        const output_states = ref_tx.raw.raw.map(s => JSON.parse(s || JSON.stringify(StateSet.CreateState())));
        const output_owners = output_states.map(o => o.owner);
        const outputed = StateData.map(s => {
            if (s.kind != "state")
                return s;
            const i = output_owners.indexOf(s.owner);
            if (i != -1)
                return output_states[i];
            else
                return s;
        });
        const reqed = outputed.map(s => {
            if (s.kind != "state" || s.owner != requester)
                return s;
            return _.new_obj(s, s => {
                s.data.gas = "0";
                s.amount = math.chain(s.amount).subtract(gas).done();
                return s;
            });
        });
        const refed = reqed.map(s => {
            if (s.kind != "state" || s.owner != refresher)
                return s;
            return _.new_obj(s, s => {
                s.amount = math.chain(s.amount).add(gas).done();
                if (s.data.fee == null)
                    s.data.fee = fee.toFixed(18);
                else
                    s.data.fee = math.chain(Number(s.data.fee || "0")).add(fee).done().toFixed(18);
                return s;
            });
        });
        const gained = refed.map(s => {
            const income = Number(s.data.income || "0");
            if (income === 0)
                return s;
            return _.new_obj(s, s => {
                s.amount = math.chain(s.amount).add(income).done();
                s.data.income = "0";
                return s;
            });
        });
        const reduced = gained.map(s => {
            if (s.kind != "state" || s.token != constant_1.constant.unit || req_tx.meta.bases.indexOf(s.owner) === -1)
                return s;
            return _.new_obj(s, s => {
                s.amount = math.chain(s.amount).multiply(unit_reduce).done();
                return s;
            });
        });
        const added = LockData.map(l => {
            const index = req_tx.meta.bases.indexOf(l.address);
            if (index != -1) {
                return _.new_obj(l, l => {
                    l.state = "yet";
                    return l;
                });
            }
            else
                return l;
        });
        return [reduced, added];
    }
};
