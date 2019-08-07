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
const tx_set = __importStar(require("./tx"));
const data = __importStar(require("./data"));
const constant_1 = require("./constant");
const big_integer_1 = __importDefault(require("big-integer"));
const P = __importStar(require("p-iteration"));
exports.rocate_finalize_validators = (uniters) => {
    return uniters.reduce((res, val, i) => {
        if (i === 0)
            res[uniters.length - 1] = val;
        else
            res[i - 1] = val;
        return res;
    }, new Array(uniters.length));
};
const validators_drop_out = async (validators, block_height, trie, state_db) => {
    const states = await P.map(validators, async (address) => {
        return await data.read_from_trie(trie, state_db, address, 0, state_set.CreateState("00", constant_1.constant.unit, address, "00", ["01", "00"]));
    });
    const amounts = states.map(s => {
        if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(constant_1.constant.unit, 16)))
            return big_integer_1.default("00");
        const flag = s.data[0];
        if (flag === "00")
            return big_integer_1.default("00");
        const pre_height = s.data[1];
        const reduce = big_integer_1.default.max(big_integer_1.default(block_height, 16).subtract(big_integer_1.default(pre_height, 16)), big_integer_1.default(1));
        return (() => {
            const computed = big_integer_1.default(s.amount, 16).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("00");
            else
                return computed;
        })();
    });
    return validators.filter((address, i) => {
        if (amounts[i].lesserOrEquals(0))
            return false;
        else
            return true;
    });
};
const choose_finalize_validators = async (uniters, block_height, trie, state_db) => {
    let choosed = [];
    if (uniters.length < constant_1.constant.finalize_size)
        choosed = uniters;
    else
        choosed = uniters.slice(0, constant_1.constant.finalize_size);
    return await validators_drop_out(choosed, block_height, trie, state_db);
};
exports.verify_finalized = async (key_block, signatures, uniters, trie, state_db) => {
    const v_s = signatures.map(s => tx_set.get_recover_id_from_sign(s));
    const pub_keys = signatures.map((s, i) => crypto_set.recover(key_block.hash, s.data, v_s[i]));
    const addresses = pub_keys.map(key => crypto_set.generate_address(constant_1.constant.unit, key));
    const finalize_validators = await choose_finalize_validators(uniters, key_block.meta.height, trie, state_db);
    if (addresses.some(add => finalize_validators.indexOf(add) === -1) || addresses.filter((val, i, array) => array.indexOf(val) === i).length != addresses.length)
        return false;
    else if (big_integer_1.default(addresses.length).lesser(big_integer_1.default(finalize_validators.length).times(constant_1.constant.fault_tolerance).divide(100)))
        return false;
    else
        return true;
};
exports.sign_finalize = (hash, private_key) => {
    const id = constant_1.constant.my_version + constant_1.constant.my_chain_id + constant_1.constant.my_net_id;
    const signed = crypto_set.sign(hash, private_key);
    const v = _.bigInt2hex(big_integer_1.default(id, 16).multiply(2).add(8).add(big_integer_1.default(28).subtract(big_integer_1.default(signed[0], 16))));
    const sign = {
        data: signed[1],
        v: v
    };
    return sign;
};
