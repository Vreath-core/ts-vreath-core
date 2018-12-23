"use strict";
exports.__esModule = true;
var _ = require("./basic");
var CryptoSet = require("./crypto_set");
var StateSet = require("./state");
var BlockSet = require("./block");
var con_1 = require("./con");
var math = require("mathjs");
math.config({
    number: 'BigNumber'
});
exports.empty_tx = function () {
    var meta = {
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
    var add = {
        height: 0,
        hash: '',
        index: 0
    };
    var raw = {
        signature: [],
        raw: [],
        log: ''
    };
    var hash = _.ObjectHash(meta);
    return {
        hash: hash,
        meta: meta,
        raw: raw,
        additional: add
    };
};
exports.empty_tx_pure = function () {
    var tx = exports.empty_tx();
    return {
        hash: tx.hash,
        meta: tx.meta,
        additional: tx.additional
    };
};
exports.tx_to_pure = function (tx) {
    return {
        hash: tx.hash,
        meta: tx.meta,
        additional: tx.additional
    };
};
exports.pure_to_tx = function (pure, block) {
    if (pure.additional.height != block.meta.height || pure.additional.hash != block.txs[pure.additional.index].hash)
        return exports.empty_tx();
    var raw = block.raws[pure.additional.index];
    return {
        hash: pure.hash,
        meta: pure.meta,
        raw: raw,
        additional: pure.additional
    };
};
exports.empty_lock = function () {
    return {
        address: '',
        state: "yet",
        height: 0,
        block_hash: '',
        index: 0,
        tx_hash: ''
    };
};
var hashed_pub_check = function (state, pubs) {
    return state.owner.split(':')[2] != _.toHash(_.reduce_pub(pubs));
};
exports.requested_check = function (base_state, LockData) {
    var addresses = LockData.map(function (l) { return l.address; });
    return base_state.some(function (state) {
        var index = addresses.indexOf(state.owner);
        var val = LockData[index];
        if (index === -1)
            return false;
        else if (val.state === "yet")
            return false;
        else
            return true;
    });
};
exports.refreshed_check = function (base, height, block_hash, index, tx_hash, LockData) {
    var addresses = LockData.map(function (l) { return l.address; });
    return base.some(function (key) {
        if (key.split(':')[2] === _.toHash(''))
            return false;
        var i = addresses.indexOf(key);
        var val = LockData[i];
        if (i === -1)
            return true;
        else if (val.state === "already" && val.height === height && val.block_hash === block_hash && val.index === index && val.tx_hash === tx_hash)
            return false;
        else
            return true;
    });
};
var state_check = function (state) {
    return _.address_form_check(state.owner, con_1.constant.token_name_maxsize) || state.owner.split(":")[1] != state.token || state.nonce < 0 || math.smaller(state.amount, 0) ||
        math.smaller(state.issued, 0) || Buffer.from(state.code).length <= Buffer.from(_.toHash('')).length;
};
var base_declaration_check = function (target, bases, StateData) {
    var getted = StateData.filter(function (s) { return s.owner === target.owner; })[0];
    return getted != null && bases.indexOf(target.owner) === -1;
};
exports.tx_fee = function (tx) {
    var price = tx.meta.feeprice;
    var meta_part = _.Object2string(_.new_obj(tx.meta, function (m) {
        delete m.feeprice;
        return m;
    }));
    var raw_part = _.Object2string(tx.raw);
    var target = meta_part + raw_part;
    return math.chain(price).multiply(Buffer.from(target).length).done();
};
exports.unit_hash = function (request, height, block_hash, nonce, refresher, output, unit_price) {
    return _.toHashNum(math.chain(_.Hex_to_Num(request)).add(height).add(_.Hex_to_Num(block_hash)).add(nonce).add(_.toHashNum(refresher)).add(_.Hex_to_Num(output)).add(unit_price).toString());
};
var mining = function (request, height, block_hash, refresher, output, unit_price) {
    var nonce = -1;
    var num = 0;
    var i = 0;
    do {
        i++;
        //if(i>1000000) break;
        nonce++;
        num = exports.unit_hash(request, height, block_hash, nonce, refresher, output, unit_price);
    } while (math.larger(num, con_1.constant.pow_target));
    return nonce;
};
exports.find_req_tx = function (ref_tx, chain) {
    var height = ref_tx.meta.height || 0;
    var block = chain[height] || BlockSet.empty_block();
    if (block.hash != ref_tx.meta.block_hash)
        return exports.empty_tx();
    var req_pure = block.txs[ref_tx.meta.index];
    if (req_pure == null)
        return exports.empty_tx();
    var req_raw = block.raws[ref_tx.meta.index];
    if (req_raw == null)
        return exports.empty_tx();
    return {
        hash: req_pure.hash,
        meta: req_pure.meta,
        raw: req_raw,
        additional: req_pure.additional
    };
};
var output_change_check = function (bases, new_states, StateData) {
    if (new_states.some(function (s) { return state_check(s) || base_declaration_check(s, bases, StateData); }))
        return true;
    return false;
};
var output_create_check = function (token_state, code, StateData) {
    var getted = StateData.filter(function (s) { return s.kind === "info" && s.token === token_state.token; })[0];
    if (getted != null || token_state.nonce != 0 || math.smaller(token_state.amount, 0) || math.smaller(token_state.issued, 0) || token_state.code != _.toHash(code))
        return true;
    else
        return false;
};
var ValidTxBasic = function (tx) {
    var hash = tx.hash;
    var tx_meta = tx.meta;
    var version = tx.meta.version;
    var network_id = tx.meta.network_id;
    var chain_id = tx.meta.chain_id;
    var address = tx.meta.address;
    var tokens = tx.meta.tokens;
    var pub_key = tx.meta.pub_key;
    var timestamp = tx.meta.timestamp;
    var log_hash = tx.meta.log_hash;
    var raw = tx.raw;
    var sign = raw.signature;
    var log_raw = raw.log;
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
    else if (timestamp.toString().length != 10 || _.time_check(timestamp)) {
        console.log("invalid timestamp");
        return false;
    }
    else if (sign.length === 0 || sign.some(function (s, i) { return _.sign_check(hash, s, pub_key[i]); })) {
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
exports.ValidRequestTx = function (tx, request_mode, StateData, LockData) {
    var tx_meta = tx.meta;
    var kind = tx_meta.kind;
    var pub_key = tx.meta.pub_key;
    var gas = tx.meta.gas;
    var tokens = tx.meta.tokens;
    var bases = tx.meta.bases;
    var input = tx.meta.input;
    var raw_data = tx.raw.raw;
    var native = con_1.constant.native;
    var requester = CryptoSet.GenereateAddress(native, _.reduce_pub(pub_key));
    var requester_state = StateData.filter(function (s) {
        return s.kind === "state" && s.token === native && s.owner === requester && math.chain(s.amount).subtract(exports.tx_fee(tx)).subtract(gas).largerEq(0).done();
    })[0];
    var token_states = tokens.map(function (key) {
        return StateData.filter(function (s) { return s.kind === "info" && s.token === key; });
    });
    var base_states = bases.map(function (key) {
        return StateData.filter(function (s) { return s.kind === "state" && tokens.indexOf(s.token) != -1 && s.owner === key; })[0] || StateSet.CreateState();
    });
    if (!ValidTxBasic(tx)) {
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
    else if (bases.some(function (key, i, array) { return tokens.indexOf(key.split(':')[1]) === -1 || array.indexOf(key) != i; }) || base_states.map(function (s) { return _.ObjectHash(s); }).indexOf(_.ObjectHash(StateSet.CreateState())) != -1) {
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
exports.ValidRefreshTx = function (tx, chain, refresh_mode, StateData, LockData) {
    var kind = tx.meta.kind;
    var type = tx.meta.type;
    var pub_key = tx.meta.pub_key;
    var height = tx.meta.height;
    var block_hash = tx.meta.block_hash;
    var index = tx.meta.index;
    var request = tx.meta.req_tx_hash;
    var success = tx.meta.success;
    var unit_price = tx.meta.unit_price;
    var output = tx.meta.output;
    var nonce = tx.meta.nonce;
    var raw = tx.raw;
    var output_raw = raw.raw;
    var block = chain[height] || BlockSet.empty_block();
    var pow_target = con_1.constant.pow_target;
    var req_tx = exports.find_req_tx(tx, chain);
    var native = con_1.constant.native;
    var refresher = CryptoSet.GenereateAddress(native, _.reduce_pub(pub_key));
    var refresher_state = StateData.filter(function (s) { return s.kind === "state" && s.owner === refresher && s.token === native && math.chain(s.amount).add(req_tx.meta.gas).subtract(fee).largerEq(0).done(); })[0];
    var unit = con_1.constant.unit;
    var unit_add = CryptoSet.GenereateAddress(unit, _.reduce_pub(pub_key));
    var fee = exports.tx_fee(tx);
    var block_tx_hashes = block.txs.map(function (tx) { return tx.hash; });
    var bases = req_tx.meta.bases;
    var output_states = raw.raw.map(function (s) { return JSON.parse(s); });
    if (!ValidTxBasic(tx)) {
        return false;
    }
    else if (kind != "refresh") {
        console.log("invalid kind");
        return false;
    }
    else if (math.larger(exports.unit_hash(request, height, block_hash, nonce, unit_add, output, unit_price), pow_target)) {
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
exports.native_code = function (StateData, req_tx) {
    var native = con_1.constant.native;
    var base = req_tx.meta.bases;
    if (req_tx.meta.tokens[0] != native || req_tx.meta.type != "change")
        return StateData;
    var type = req_tx.raw.raw[0];
    switch (type) {
        case "remit":
            var remiter_1 = base[0];
            var remiter_state = StateData.filter(function (s) { return s.kind === "state" && s.token === native && s.owner === remiter_1; })[0];
            var receivers_1 = base.slice(1);
            var amounts_1 = JSON.parse(req_tx.raw.raw[1] || "[]").map(function (str) { return Number(str); });
            var sum_1 = amounts_1.reduce(function (s, a) { return s + a; }, 0);
            var fee = Number(remiter_state.data.fee || "0");
            var gas = Number(remiter_state.data.gas || "0");
            if (remiter_state == null || amounts_1.some(function (n) { return math.smaller(n, 0); }) || math.chain(remiter_state.amount).subtract(sum_1).subtract(fee).subtract(gas).smaller(0).done())
                return StateData;
            var remited = StateData.map(function (s) {
                if (s.kind != "state" || s.token != native || s.owner != remiter_1)
                    return s;
                var income = Number(s.data.income || "0");
                return _.new_obj(s, function (s) {
                    s.nonce++;
                    s.amount = math.chain(s.amount).subtract(income).subtract(sum_1).done();
                    return s;
                });
            });
            var recieved = remited.map(function (s) {
                var index = receivers_1.indexOf(s.owner);
                if (s.kind != "state" || s.token != native || index === -1)
                    return s;
                var income = Number(s.data.income || "0");
                return _.new_obj(s, function (s) {
                    s.nonce++;
                    s.amount = math.chain(s.amount).subtract(income).add(amounts_1[index]).done();
                    return s;
                });
            });
            return recieved;
        default: return StateData;
    }
};
exports.unit_code = function (StateData, req_tx, chain) {
    var unit = con_1.constant.unit;
    var native = con_1.constant.native;
    var unit_base = req_tx.meta.bases.filter(function (str) { return str.split(':')[1] === unit; });
    var native_base = req_tx.meta.bases.filter(function (str) { return str.split(':')[1] === native; });
    if (req_tx.meta.tokens[0] != unit || req_tx.meta.type != "change" || req_tx.raw.raw[0] != "buy")
        return StateData;
    var inputs = req_tx.raw.raw;
    var remiter = req_tx.meta.address;
    var units = JSON.parse(inputs[1]);
    var unit_check = units.some(function (u) {
        var unit_ref_tx = (function () {
            var block;
            var tx;
            for (var _i = 0, _a = chain.slice().reverse(); _i < _a.length; _i++) {
                block = _a[_i];
                for (var _b = 0, _c = block.txs; _b < _c.length; _b++) {
                    tx = _c[_b];
                    if (tx.meta.kind === "refresh" && tx.meta.req_tx_hash === u.request && tx.meta.height === u.height && tx.meta.block_hash === u.block_hash)
                        return tx;
                }
            }
            return exports.empty_tx_pure();
        })();
        var unit_owner_state = StateData.filter(function (s) { return s.kind === "state" && s.token === unit && s.owner === u.address; })[0] || StateSet.CreateState(0, u.address, unit, 0, { used: "[]" });
        var used_units = JSON.parse(unit_owner_state.data.used || "[]");
        return unit_ref_tx.meta.output != u.output || math.larger(exports.unit_hash(u.request, u.height, u.block_hash, u.nonce, u.address, u.output, u.unit_price), con_1.constant.pow_target) || unit_base.indexOf(u.address) != -1 || used_units.indexOf(_.toHash((_.Hex_to_Num(u.request) + u.height + _.Hex_to_Num(u.block_hash)).toString())) != -1;
    });
    if (unit_check || _.ObjectHash(native_base.map(function (add) { return add.split(":")[2]; })) != _.ObjectHash(unit_base.map(function (add) { return add.split(":")[2]; })))
        return StateData;
    var hashes = units.map(function (u) { return _.toHash(_.toHash((_.Hex_to_Num(u.request) + u.height + _.Hex_to_Num(u.block_hash)).toString())); });
    if (hashes.some(function (v, i, arr) { return arr.indexOf(v) != i; }))
        return StateData;
    var unit_price_map = units.reduce(function (res, unit) {
        if (res[unit.address] == null) {
            res[unit.address] = unit.unit_price;
            return res;
        }
        else {
            res[unit.address] = math.chain(res[unit.address]).add(unit.unit_price).done();
            return res;
        }
    }, {});
    var unit_sum = units.length;
    var price_sum = units.reduce(function (sum, u) { return sum + u.unit_price; }, 0);
    var native_amounts = JSON.parse(req_tx.raw.raw[2] || "[]").map(function (str) { return Number(str); });
    var native_price_map = native_base.reduce(function (res, add, i) {
        if (res[add] == null) {
            res[add] = native_amounts[i];
            return res;
        }
        else {
            res[add] = math.chain(res[add]).add(native_amounts[i]).done();
            return res;
        }
    }, {});
    var native_sum = native_amounts.reduce(function (s, a) { return s + a; }, 0);
    if (_.ObjectHash(unit_price_map) != _.ObjectHash(native_price_map) || !(math.equal(price_sum, native_sum)))
        return StateData;
    var unit_bought = StateData.map(function (s) {
        if (s.kind === "state" && s.token === unit && s.owner === remiter) {
            var reduce_1 = Number(s.data.reduce || "1");
            if ((math.chain(s.amount).add(unit_sum)).multiply(reduce_1).smaller(0))
                return s;
            return _.new_obj(s, function (s) {
                s.nonce++;
                s.amount = math.chain(s.amount).divide(reduce_1).add(unit_sum).done();
                return s;
            });
        }
        else
            return s;
    });
    var unit_commit = unit_bought.map(function (s) {
        if (s.kind === "state" && s.token === unit && unit_base.indexOf(s.owner) != -1) {
            var used_1 = JSON.parse(s.data.used || "[]");
            var own_units = units.filter(function (u) { return u.address === s.owner; });
            var items_1 = own_units.map(function (u) { return _.toHash(_.toHash((_.Hex_to_Num(u.request) + u.height + _.Hex_to_Num(u.block_hash)).toString())); });
            return _.new_obj(s, function (s) {
                s.nonce++;
                s.data.used = used_1.concat(items_1);
                return s;
            });
        }
        else
            return s;
    });
    return unit_commit;
};
exports.CreateRequestTx = function (pub_key, type, tokens, bases, feeprice, gas, input_raw, log) {
    var address = CryptoSet.GenereateAddress(tokens[0], _.reduce_pub(pub_key));
    var date = new Date();
    var timestamp = date.getTime();
    var input = _.ObjectHash(input_raw);
    var log_hash = _.toHash(log);
    var empty = exports.empty_tx();
    var meta = {
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
    var hash = _.ObjectHash(meta);
    var tx = {
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
exports.CreateRefreshTx = function (pub_key, feeprice, unit_price, height, block_hash, index, req_tx_hash, success, nonce, output_raw, log_raw, chain) {
    var req_tx = chain[height].txs[index];
    var token = req_tx.meta.tokens[0];
    var address = CryptoSet.GenereateAddress(token, _.reduce_pub(pub_key));
    var date = new Date();
    var timestamp = date.getTime();
    var output = _.ObjectHash(output_raw);
    var log_hash = _.toHash(log_raw);
    var empty = exports.empty_tx_pure();
    var meta = {
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
    var hash = _.ObjectHash(meta);
    var raw = {
        signature: [],
        raw: output_raw,
        log: log_raw
    };
    var tx = {
        hash: hash,
        meta: meta,
        raw: raw,
        additional: empty.additional
    };
    return tx;
};
exports.SignTx = function (tx, my_private, my_pub) {
    var pub_keys = tx.meta.pub_key;
    var index = pub_keys.indexOf(my_pub);
    if (index === -1)
        return tx;
    var sign = CryptoSet.SignData(tx.hash, my_private);
    return _.new_obj(tx, function (tx) {
        tx.raw.signature[index] = sign;
        return tx;
    });
};
exports.AcceptRequestTx = function (tx, height, block_hash, index, StateData, LockData) {
    var requester = CryptoSet.GenereateAddress(con_1.constant.native, _.reduce_pub(tx.meta.pub_key));
    var fee = exports.tx_fee(tx);
    var gas = tx.meta.gas;
    var reqed = StateData.map(function (s) {
        if (s.owner != requester)
            return s;
        return _.new_obj(s, function (s) {
            if (s.data.fee == null)
                s.data.fee = fee.toFixed(18);
            else
                s.data.fee = math.chain(Number(s.data.fee || "0")).add(fee).done().toFixed(18);
            s.data.gas = gas.toFixed(18);
            return s;
        });
    });
    var gained = reqed.map(function (s) {
        var income = Number(s.data.income || "0");
        if (income === 0)
            return s;
        return _.new_obj(s, function (s) {
            s.data.income = "0";
            return s;
        });
    });
    var bases = tx.meta.bases;
    var added = LockData.map(function (l) {
        var i = bases.indexOf(l.address);
        if (i === -1)
            return l;
        return _.new_obj(l, function (l) {
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
exports.AcceptRefreshTx = function (ref_tx, chain, StateData, LockData) {
    var native = con_1.constant.native;
    var unit = con_1.constant.unit;
    var req_tx = exports.find_req_tx(ref_tx, chain);
    var requester = CryptoSet.GenereateAddress(native, _.reduce_pub(req_tx.meta.pub_key));
    var refresher = CryptoSet.GenereateAddress(native, _.reduce_pub(ref_tx.meta.pub_key));
    var fee = exports.tx_fee(ref_tx);
    var gas = req_tx.meta.gas;
    var added = LockData.map(function (l) {
        var index = req_tx.meta.bases.indexOf(l.address);
        if (index != -1) {
            return _.new_obj(l, function (l) {
                l.state = "yet";
                return l;
            });
        }
        else
            return l;
    });
    if (req_tx.meta.type === "create") {
        var token_info_1 = JSON.parse(req_tx.raw.raw[0]);
        var created = StateData.map(function (s) {
            if (s.kind === "info" && s.token === token_info_1.token)
                return token_info_1;
            else
                return s;
        });
        var reqed = created.map(function (s) {
            if (s.kind != "state" || s.owner != requester)
                return s;
            return _.new_obj(s, function (s) {
                s.data.gas = "0";
                s.amount = math.chain(s.amount).subtract(gas).done();
                return s;
            });
        });
        var refed = reqed.map(function (s) {
            if (s.kind != "state" || s.owner != refresher)
                return s;
            return _.new_obj(s, function (s) {
                s.amount = math.chain(s.amount).add(gas).done();
                if (s.data.fee == null)
                    s.data.fee = fee.toFixed(18);
                else
                    s.data.fee = math.chain(Number(s.data.fee || "0")).add(fee).done().toFixed(18);
                return s;
            });
        });
        var gained = refed.map(function (s) {
            var income = Number(s.data.income || "0");
            if (income === 0)
                return s;
            return _.new_obj(s, function (s) {
                s.amount = math.chain(s.amount).add(income).done();
                s.data.income = "0";
                return s;
            });
        });
        return [gained, added];
    }
    else {
        var output_states_1 = ref_tx.raw.raw.map(function (s) { return JSON.parse(s || JSON.stringify(StateSet.CreateState())); });
        var output_owners_1 = output_states_1.map(function (o) { return o.owner; });
        var outputed = StateData.map(function (s) {
            if (s.kind != "state")
                return s;
            var i = output_owners_1.indexOf(s.owner);
            if (i != -1)
                return output_states_1[i];
            else
                return s;
        });
        var reqed = outputed.map(function (s) {
            if (s.kind != "state" || s.owner != requester)
                return s;
            return _.new_obj(s, function (s) {
                s.data.gas = "0";
                s.amount = math.chain(s.amount).subtract(gas).done();
                return s;
            });
        });
        var refed = reqed.map(function (s) {
            if (s.kind != "state" || s.owner != refresher)
                return s;
            return _.new_obj(s, function (s) {
                s.amount = math.chain(s.amount).add(gas).done();
                if (s.data.fee == null)
                    s.data.fee = fee.toFixed(18);
                else
                    s.data.fee = math.chain(Number(s.data.fee || "0")).add(fee).done().toFixed(18);
                return s;
            });
        });
        var gained = refed.map(function (s) {
            var income = Number(s.data.income || "0");
            if (income === 0)
                return s;
            return _.new_obj(s, function (s) {
                s.amount = math.chain(s.amount).add(income).done();
                s.data.income = "0";
                return s;
            });
        });
        var added_1 = LockData.map(function (l) {
            var index = req_tx.meta.bases.indexOf(l.address);
            if (index != -1) {
                return _.new_obj(l, function (l) {
                    l.state = "yet";
                    return l;
                });
            }
            else
                return l;
        });
        return [gained, added_1];
    }
};
