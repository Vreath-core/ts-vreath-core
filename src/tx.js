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
const BlockSet = __importStar(require("./block"));
const con_1 = require("./con");
const math = __importStar(require("mathjs"));
math.config({
    number: 'BigNumber'
});
exports.empty_tx = () => {
    const meta = {
        kind: "request",
        type: "change",
        version: con_1.constant.my_version,
        network_id: con_1.constant.my_net_id,
        chain_id: con_1.constant.my_chain_id,
        timestamp: 0,
        address: '',
        pub_key: [],
        feeprice: 0,
        gas: 0,
        tokens: [],
        bases: [],
        input: '',
        height: 0,
        block_hash: '',
        index: 0,
        req_tx_hash: '',
        success: false,
        output: '',
        nonce: 0,
        unit_price: 0,
        log_hash: ''
    };
    const add = {
        height: 0,
        hash: '',
        index: 0
    };
    const raw = {
        signature: [],
        raw: [],
        log: ''
    };
    const hash = _.ObjectHash(meta);
    return {
        hash: hash,
        meta: meta,
        raw: raw,
        additional: add
    };
};
exports.empty_tx_pure = () => {
    const tx = exports.empty_tx();
    return {
        hash: tx.hash,
        meta: tx.meta,
        additional: tx.additional
    };
};
exports.tx_to_pure = (tx) => {
    return {
        hash: tx.hash,
        meta: tx.meta,
        additional: tx.additional
    };
};
exports.pure_to_tx = (pure, block) => {
    if (pure.additional.height != block.meta.height || pure.additional.hash != block.txs[pure.additional.index].hash)
        return exports.empty_tx();
    const raw = block.raws[pure.additional.index];
    return {
        hash: pure.hash,
        meta: pure.meta,
        raw: raw,
        additional: pure.additional
    };
};
exports.empty_lock = () => {
    return {
        address: '',
        state: "yet",
        height: 0,
        block_hash: '',
        index: 0,
        tx_hash: ''
    };
};
const hashed_pub_check = (state, pubs) => {
    return state.owner.split(':')[2] != _.toHash(_.reduce_pub(pubs));
};
exports.requested_check = (base_state, LockData) => {
    const addresses = LockData.map(l => l.address);
    return base_state.some(state => {
        const index = addresses.indexOf(state.owner);
        const val = LockData[index];
        if (index === -1)
            return false;
        else if (val.state === "yet")
            return false;
        else
            return true;
    });
};
exports.refreshed_check = (base, height, block_hash, index, tx_hash, LockData) => {
    const addresses = LockData.map(l => l.address);
    return base.some(key => {
        if (key.split(':')[2] === _.toHash(''))
            return false;
        const i = addresses.indexOf(key);
        const val = LockData[i];
        if (i === -1)
            return true;
        else if (val.state === "already" && val.height === height && val.block_hash === block_hash && val.index === index && val.tx_hash === tx_hash)
            return false;
        else
            return true;
    });
};
const state_check = (state) => {
    return _.address_form_check(state.owner, con_1.constant.token_name_maxsize) || state.owner.split(":")[1] != state.token || state.nonce < 0 || math.smaller(state.amount, 0) ||
        math.smaller(state.issued, 0) || Buffer.from(state.code).length <= Buffer.from(_.toHash('')).length;
};
const base_declaration_check = (target, bases, StateData) => {
    const getted = StateData.filter(s => s.owner === target.owner)[0];
    return getted != null && bases.indexOf(target.owner) === -1;
};
exports.tx_fee = (tx) => {
    const price = tx.meta.feeprice;
    const meta_part = _.Object2string(_.new_obj(tx.meta, m => {
        delete m.feeprice;
        return m;
    }));
    const raw_part = _.Object2string(tx.raw);
    const target = meta_part + raw_part;
    return math.chain(price).multiply(Buffer.from(target).length).done();
};
const unit_hash = (request, height, block_hash, nonce, refresher, output, unit_price) => {
    return _.toHashNum(math.chain(_.Hex_to_Num(request)).add(height).add(_.Hex_to_Num(block_hash)).add(nonce).add(_.toHashNum(refresher)).add(_.Hex_to_Num(output)).add(unit_price).toString());
};
const mining = (request, height, block_hash, refresher, output, unit_price) => {
    let nonce = -1;
    let num = 0;
    let i = 0;
    do {
        i++;
        //if(i>1000000) break;
        nonce++;
        num = unit_hash(request, height, block_hash, nonce, refresher, output, unit_price);
    } while (math.larger(num, con_1.constant.pow_target));
    return nonce;
};
exports.find_req_tx = (ref_tx, chain) => {
    const height = ref_tx.meta.height || 0;
    const block = chain[height] || BlockSet.empty_block();
    if (block.hash != ref_tx.meta.block_hash)
        return exports.empty_tx();
    const req_pure = block.txs[ref_tx.meta.index] || exports.empty_tx().raw;
    if (req_pure == null)
        return exports.empty_tx();
    const req_raw = block.raws[ref_tx.meta.index] || exports.empty_tx().raw;
    return {
        hash: req_pure.hash,
        meta: req_pure.meta,
        raw: req_raw,
        additional: req_pure.additional
    };
};
const output_change_check = (bases, new_states, StateData) => {
    if (new_states.some(s => state_check(s) || base_declaration_check(s, bases, StateData)))
        return true;
    return false;
};
const output_create_check = (token_state, code, StateData) => {
    const getted = StateData.filter(s => s.kind === "info" && s.token === token_state.token)[0];
    if (getted != null || token_state.nonce != 0 || math.smaller(token_state.amount, 0) || math.smaller(token_state.issued, 0) || token_state.code != _.toHash(code))
        return true;
    else
        return false;
};
exports.ValidTxBasic = (tx) => {
    const hash = tx.hash;
    const tx_meta = tx.meta;
    const version = tx.meta.version;
    const network_id = tx.meta.network_id;
    const chain_id = tx.meta.chain_id;
    const address = tx.meta.address;
    const tokens = tx.meta.tokens;
    const pub_key = tx.meta.pub_key;
    const timestamp = tx.meta.timestamp;
    const log_hash = tx.meta.log_hash;
    const raw = tx.raw;
    const sign = raw.signature;
    const log_raw = raw.log;
    if (_.object_hash_check(hash, tx_meta)) {
        console.log("invalid hash");
        return false;
    }
    else if (version != con_1.constant.my_version) {
        console.log("different version");
        return false;
    }
    else if (network_id != con_1.constant.my_net_id) {
        console.log("different network id");
        return false;
    }
    else if (chain_id != con_1.constant.my_chain_id) {
        console.log("different chain id");
        return false;
    }
    else if (_.address_check(address, _.reduce_pub(pub_key), tokens[0])) {
        console.log("invalid address");
        return false;
    }
    else if (_.time_check(timestamp)) {
        console.log("invalid timestamp");
        return false;
    }
    else if (sign.length === 0 || sign.some((s, i) => _.sign_check(hash, s, pub_key[i]))) {
        console.log("invalid signature");
        return false;
    }
    else if (log_hash != _.toHash(log_raw)) {
        console.log("invalid log hash");
        return false;
    }
    else {
        return true;
    }
};
exports.ValidRequestTx = (tx, request_mode, StateData, LockData) => {
    const tx_meta = tx.meta;
    const kind = tx_meta.kind;
    const pub_key = tx.meta.pub_key;
    const gas = tx.meta.gas;
    const tokens = tx.meta.tokens;
    const bases = tx.meta.bases;
    const input = tx.meta.input;
    const raw_data = tx.raw.raw;
    const native = con_1.constant.native;
    const requester = CryptoSet.GenereateAddress(native, _.reduce_pub(pub_key));
    const requester_state = StateData.filter(s => {
        return s.kind === "state" && s.token === native && s.owner === requester && math.chain(s.amount).subtract(exports.tx_fee(tx)).subtract(gas).largerEq(0).done();
    })[0];
    const token_states = tokens.map(key => {
        return StateData.filter(s => s.kind === "info" && s.token === key);
    });
    const base_states = bases.map(key => {
        return StateData.filter(s => s.kind === "state" && tokens.indexOf(s.token) != -1 && s.owner === key)[0] || StateSet.CreateState();
    });
    if (!exports.ValidTxBasic(tx)) {
        return false;
    }
    else if (kind != "request") {
        console.log("invalid kind");
        return false;
    }
    else if (requester_state == null || hashed_pub_check(requester_state, pub_key) || exports.requested_check([requester_state], LockData)) {
        console.log("invalid requester");
        return false;
    }
    else if (tokens.length < 1 || tokens.length > 5 || tokens.length != token_states.length) {
        console.log("invalid token");
        return false;
    }
    else if (bases.some((key, i, array) => tokens.indexOf(key.split(':')[1]) === -1 || array.indexOf(key) != i) || base_states.map(s => _.ObjectHash(s)).indexOf(_.ObjectHash(StateSet.CreateState())) != -1) {
        console.log("invalid base");
        return false;
    }
    else if (request_mode && exports.requested_check(base_states, LockData)) {
        console.log("base states are already requested");
        return false;
    }
    else if (input != _.ObjectHash(raw_data)) {
        console.log("invalid input hash");
        return false;
    }
    else {
        return true;
    }
};
exports.ValidRefreshTx = (tx, chain, refresh_mode, StateData, LockData) => {
    const kind = tx.meta.kind;
    const type = tx.meta.type;
    const pub_key = tx.meta.pub_key;
    const height = tx.meta.height;
    const block_hash = tx.meta.block_hash;
    const index = tx.meta.index;
    const request = tx.meta.req_tx_hash;
    const success = tx.meta.success;
    const unit_price = tx.meta.unit_price;
    const output = tx.meta.output;
    const nonce = tx.meta.nonce;
    const raw = tx.raw;
    const output_raw = raw.raw;
    const block = chain[height] || BlockSet.empty_block();
    const pow_target = con_1.constant.pow_target;
    const req_tx = exports.find_req_tx(tx, chain);
    const native = con_1.constant.native;
    const refresher = CryptoSet.GenereateAddress(native, _.reduce_pub(pub_key));
    const refresher_state = StateData.filter(s => s.kind === "state" && s.owner === refresher && s.token === native && math.chain(s.amount).add(req_tx.meta.gas).subtract(fee).largerEq(0).done())[0];
    const unit = con_1.constant.unit;
    const unit_add = CryptoSet.GenereateAddress(unit, _.reduce_pub(pub_key));
    const fee = exports.tx_fee(tx);
    const block_tx_hashes = block.txs.map(tx => tx.hash);
    const bases = req_tx.meta.bases;
    const output_states = raw.raw.map(s => JSON.parse(s));
    if (!exports.ValidTxBasic(tx)) {
        return false;
    }
    else if (kind != "refresh") {
        console.log("invalid kind");
        return false;
    }
    else if (math.larger(unit_hash(request, height, block_hash, nonce, unit_add, output, unit_price), pow_target)) {
        console.log("invalid nonce");
        return false;
    }
    else if (math.smaller(unit_price, 0)) {
        console.log("invalid unit_price");
        return false;
    }
    else if (req_tx.hash == exports.empty_tx_pure().hash || block_tx_hashes.indexOf(req_tx.hash) === -1) {
        console.log("invalid request hash");
        return false;
    }
    else if (refresh_mode && exports.refreshed_check(bases, height, block.hash, index, request, LockData)) {
        console.log("base states are already refreshed");
        return false;
    }
    else if (refresher_state == null || hashed_pub_check(refresher_state, pub_key) || exports.requested_check([refresher_state], LockData)) {
        console.log("invalid refresher");
        return false;
    }
    else if (output != _.ObjectHash(output_raw)) {
        console.log("invalid output hash");
        return false;
    }
    else if (refresh_mode && (!success || (type == "change" && output_change_check(bases, output_states, StateData)) || (type === "create" && output_create_check(JSON.parse(raw.raw[0]), raw.raw[1], StateData)))) {
        console.log("invalid output");
        return false;
    }
    else {
        return true;
    }
};
exports.native_code = (StateData, req_tx) => {
    const native = con_1.constant.native;
    const base = req_tx.meta.bases;
    if (req_tx.meta.tokens[0] != native || req_tx.meta.type != "change")
        return StateData;
    const type = req_tx.raw.raw[0];
    switch (type) {
        case "remit":
            const remiter = base[0];
            const remiter_state = StateData.filter(s => s.kind === "state" && s.token === native && s.owner === remiter)[0];
            const receivers = base.slice(1);
            const amounts = JSON.parse(req_tx.raw.raw[1] || "[]").map((str) => Number(str));
            const sum = amounts.reduce((s, a) => s + a, 0);
            const fee = Number(remiter_state.data.fee || "0");
            const gas = Number(remiter_state.data.gas || "0");
            if (remiter_state == null || amounts.some(n => math.smaller(n, 0)) || math.chain(remiter_state.amount).subtract(sum).subtract(fee).subtract(gas).smaller(0).done())
                return StateData;
            const remited = StateData.map(s => {
                if (s.kind != "state" || s.token != native || s.owner != remiter)
                    return s;
                const income = Number(s.data.income || "0");
                return _.new_obj(s, (s) => {
                    s.nonce++;
                    s.amount = math.chain(s.amount).subtract(income).subtract(sum).done();
                    return s;
                });
            });
            const recieved = remited.map(s => {
                const index = receivers.indexOf(s.owner);
                if (s.kind != "state" || s.token != native || index === -1)
                    return s;
                const income = Number(s.data.income || "0");
                return _.new_obj(s, s => {
                    s.nonce++;
                    s.amount = math.chain(s.amount).subtract(income).add(amounts[index]).done();
                    return s;
                });
            });
            return recieved;
        default: return StateData;
    }
};
exports.unit_code = (StateData, req_tx, chain) => {
    const unit = con_1.constant.unit;
    const native = con_1.constant.native;
    const unit_base = req_tx.meta.bases.filter(str => str.split(':')[1] === unit);
    const native_base = req_tx.meta.bases.filter(str => str.split(':')[1] === native);
    if (req_tx.meta.tokens[0] != unit || req_tx.meta.type != "change" || req_tx.raw.raw[0] != "buy")
        return StateData;
    const inputs = req_tx.raw.raw;
    const remiter = req_tx.meta.address;
    const units = JSON.parse(inputs[1]);
    const unit_check = units.some(u => {
        const unit_ref_tx = (() => {
            let block;
            let tx;
            for (block of chain.slice().reverse()) {
                for (tx of block.txs) {
                    if (tx.meta.kind === "refresh" && tx.meta.req_tx_hash === u.request && tx.meta.height === u.height && tx.meta.block_hash === u.block_hash)
                        return tx;
                }
            }
            return exports.empty_tx_pure();
        })();
        const unit_owner_state = StateData.filter(s => s.kind === "state" && s.token === unit && s.owner === u.address)[0] || StateSet.CreateState(0, u.address, unit, 0, { used: "[]" });
        const used_units = JSON.parse(unit_owner_state.data.used || "[]");
        return unit_ref_tx.meta.output != u.output || math.larger(unit_hash(u.request, u.height, u.block_hash, u.nonce, u.address, u.output, u.unit_price), con_1.constant.pow_target) || unit_base.indexOf(u.address) != -1 || used_units.indexOf(_.toHash((_.Hex_to_Num(u.request) + u.height + _.Hex_to_Num(u.block_hash)).toString())) != -1;
    });
    if (unit_check || _.ObjectHash(native_base.map(add => add.split(":")[2])) != _.ObjectHash(unit_base.map(add => add.split(":")[2])))
        return StateData;
    const hashes = units.map(u => _.toHash(_.toHash((_.Hex_to_Num(u.request) + u.height + _.Hex_to_Num(u.block_hash)).toString())));
    if (hashes.some((v, i, arr) => arr.indexOf(v) != i))
        return StateData;
    const unit_price_map = units.reduce((res, unit) => {
        if (res[unit.address] == null) {
            res[unit.address] = unit.unit_price;
            return res;
        }
        else {
            res[unit.address] = math.chain(res[unit.address]).add(unit.unit_price).done();
            return res;
        }
    }, {});
    const unit_sum = units.length;
    const price_sum = units.reduce((sum, u) => sum + u.unit_price, 0);
    const native_amounts = JSON.parse(req_tx.raw.raw[2] || "[]").map((str) => Number(str));
    const native_price_map = native_base.reduce((res, add, i) => {
        if (res[add] == null) {
            res[add] = native_amounts[i];
            return res;
        }
        else {
            res[add] = math.chain(res[add]).add(native_amounts[i]).done();
            return res;
        }
    }, {});
    const native_sum = native_amounts.reduce((s, a) => s + a, 0);
    if (_.ObjectHash(unit_price_map) != _.ObjectHash(native_price_map) || !(math.equal(price_sum, native_sum)))
        return StateData;
    const unit_bought = StateData.map(s => {
        if (s.kind === "state" && s.token === unit && s.owner === remiter) {
            const reduce = Number(s.data.reduce || "1");
            if ((math.chain(s.amount).add(unit_sum)).multiply(reduce).smaller(0))
                return s;
            return _.new_obj(s, (s) => {
                s.nonce++;
                s.amount = math.chain(s.amount).divide(reduce).add(unit_sum).done();
                return s;
            });
        }
        else
            return s;
    });
    const unit_commit = unit_bought.map(s => {
        if (s.kind === "state" && s.token === unit && unit_base.indexOf(s.owner) != -1) {
            const used = JSON.parse(s.data.used || "[]");
            const own_units = units.filter(u => u.address === s.owner);
            const items = own_units.map(u => _.toHash(_.toHash((_.Hex_to_Num(u.request) + u.height + _.Hex_to_Num(u.block_hash)).toString())));
            return _.new_obj(s, s => {
                s.nonce++;
                s.data.used = used.concat(items);
                return s;
            });
        }
        else
            return s;
    });
    return unit_commit;
};
exports.CreateRequestTx = (pub_key, type, tokens, bases, feeprice, gas, input_raw, log) => {
    const address = CryptoSet.GenereateAddress(tokens[0], _.reduce_pub(pub_key));
    const date = new Date();
    const timestamp = date.getTime();
    const input = _.ObjectHash(input_raw);
    const log_hash = _.toHash(log);
    const empty = exports.empty_tx();
    const meta = {
        kind: "request",
        type: type,
        version: con_1.constant.my_version,
        network_id: con_1.constant.my_net_id,
        chain_id: con_1.constant.my_chain_id,
        timestamp: timestamp,
        address: address,
        pub_key: pub_key,
        feeprice: feeprice,
        gas: gas,
        tokens: tokens,
        bases: bases,
        input: input,
        height: empty.meta.height,
        block_hash: empty.meta.block_hash,
        index: empty.meta.index,
        req_tx_hash: empty.meta.req_tx_hash,
        success: empty.meta.success,
        output: empty.meta.output,
        nonce: 0,
        unit_price: empty.meta.unit_price,
        log_hash: log_hash
    };
    const hash = _.ObjectHash(meta);
    const tx = {
        hash: hash,
        meta: meta,
        raw: {
            signature: [],
            raw: input_raw,
            log: log
        },
        additional: empty.additional
    };
    return tx;
};
exports.CreateRefreshTx = (pub_key, feeprice, unit_price, height, block_hash, index, req_tx_hash, success, output_raw, log_raw, chain) => {
    const req_tx = chain[height].txs[index];
    const token = req_tx.meta.tokens[0];
    const address = CryptoSet.GenereateAddress(token, _.reduce_pub(pub_key));
    const unit = con_1.constant.unit;
    const unit_add = CryptoSet.GenereateAddress(unit, _.reduce_pub(pub_key));
    const date = new Date();
    const timestamp = date.getTime();
    const output = _.ObjectHash(output_raw);
    const nonce = mining(req_tx_hash, height, block_hash, unit_add, output, unit_price);
    const log_hash = _.toHash(log_raw);
    const empty = exports.empty_tx_pure();
    const meta = {
        kind: "refresh",
        type: empty.meta.type,
        version: con_1.constant.my_version,
        network_id: con_1.constant.my_net_id,
        chain_id: con_1.constant.my_chain_id,
        timestamp: timestamp,
        address: address,
        pub_key: pub_key,
        feeprice: feeprice,
        gas: empty.meta.gas,
        tokens: empty.meta.tokens,
        bases: empty.meta.bases,
        input: empty.meta.input,
        height: height,
        block_hash: block_hash,
        index: index,
        req_tx_hash: req_tx_hash,
        success: success,
        output: output,
        nonce: nonce,
        unit_price: unit_price,
        log_hash: log_hash
    };
    const hash = _.ObjectHash(meta);
    const raw = {
        signature: [],
        raw: output_raw,
        log: log_raw
    };
    const tx = {
        hash: hash,
        meta: meta,
        raw: raw,
        additional: empty.additional
    };
    return tx;
};
exports.SignTx = (tx, my_private, my_pub) => {
    const pub_keys = tx.meta.pub_key;
    const index = pub_keys.indexOf(my_pub);
    if (index === -1)
        return tx;
    const sign = CryptoSet.SignData(tx.hash, my_private);
    return _.new_obj(tx, tx => {
        tx.raw.signature[index] = sign;
        return tx;
    });
};
exports.AcceptRequestTx = (tx, height, block_hash, index, StateData, LockData) => {
    const requester = CryptoSet.GenereateAddress(con_1.constant.native, _.reduce_pub(tx.meta.pub_key));
    const fee = exports.tx_fee(tx);
    const gas = tx.meta.gas;
    const reqed = StateData.map(s => {
        if (s.owner != requester)
            return s;
        return _.new_obj(s, s => {
            if (s.data.fee == null)
                s.data.fee = fee.toFixed(18);
            else
                s.data.fee = math.chain(Number(s.data.fee || "0")).add(fee).done().toFixed(18);
            s.data.gas = gas.toFixed(18);
            return s;
        });
    });
    const gained = reqed.map(s => {
        const income = Number(s.data.income || "0");
        if (income === 0)
            return s;
        return _.new_obj(s, s => {
            s.data.income = "0";
            return s;
        });
    });
    const bases = tx.meta.bases;
    const added = LockData.map(l => {
        const i = bases.indexOf(l.address);
        if (i === -1)
            return l;
        return _.new_obj(l, l => {
            l.state = "already";
            l.height = height;
            l.block_hash = block_hash;
            l.index = index;
            l.tx_hash = tx.hash;
            return l;
        });
    });
    return [gained, added];
};
exports.AcceptRefreshTx = (ref_tx, chain, StateData, LockData) => {
    const native = con_1.constant.native;
    const unit = con_1.constant.unit;
    const req_tx = exports.find_req_tx(ref_tx, chain);
    const requester = CryptoSet.GenereateAddress(native, _.reduce_pub(req_tx.meta.pub_key));
    const refresher = CryptoSet.GenereateAddress(native, _.reduce_pub(ref_tx.meta.pub_key));
    const fee = exports.tx_fee(ref_tx);
    const gas = req_tx.meta.gas;
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
        return [gained, added];
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
        return [gained, added];
    }
};
