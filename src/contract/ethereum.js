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
const _ = __importStar(require("../util"));
const tx_set = __importStar(require("../tx"));
const crypto_set = __importStar(require("../crypto_set"));
const constant_1 = require("../constant");
const state_1 = require("../state");
const big_integer_1 = __importDefault(require("big-integer"));
const data_1 = require("../data");
const ethereum = constant_1.constant.ethereum;
exports.finality_height = 10;
exports.ethereum_info_address = crypto_set.generate_address(constant_1.constant.ethereum, "00");
exports.ethereum_prove = async (base_state, input_data, trie, state_db, validators, signatures) => {
    const type = input_data[0];
    switch (type) {
        case "00":
            const transfered = await transfer(input_data.slice(1, 15), trie, state_db, validators, signatures);
            if (transfered == null)
                return base_state;
            return transfered.filter(s => s != null);
        default: return base_state;
    }
};
exports.ethereum_verify = async (base_state, input_data, output_state, trie, state_db, validators, signatures) => {
    const type = input_data[0];
    switch (type) {
        case "00":
            const valid_output = await exports.ethereum_prove(base_state, input_data, trie, state_db, validators, signatures);
            const check = output_state.some((o, i) => {
                const valid = valid_output[i];
                if (valid == null)
                    return true;
                const hash1 = _.array2hash([o.nonce, o.token, o.owner, o.amount].concat(o.data));
                const hash2 = _.array2hash([valid.nonce, valid.token, valid.owner, valid.amount].concat(valid.data));
                return hash1 != hash2;
            });
            return !check;
        default: return false;
    }
};
const transfer = async (input_data, trie, state_db, validators, signatures) => {
    const header = {
        difficulty: input_data[0],
        extraData: input_data[1],
        hash: input_data[2],
        logsBloom: input_data[3],
        miner: input_data[4],
        number: input_data[5],
        parentHash: input_data[6],
        receiptsRoot: input_data[7],
        size: input_data[8],
        stateRoot: input_data[9],
        timestamp: input_data[10],
        totalDifficulty: input_data[11],
        transactionsRoot: input_data[12]
    };
    // data := [kind(memory="00"),last height,last block hash,finalized last height,finalized last block hash]
    let meta_state = await data_1.read_from_trie(trie, state_db, exports.ethereum_info_address, 0, state_1.CreateState("00", constant_1.constant.ethereum, exports.ethereum_info_address, "00", ["00", "00", crypto_set.get_sha256(""), "00", crypto_set.get_sha256("")]));
    if (big_integer_1.default(header.number, 16).lesserOrEquals(big_integer_1.default(meta_state.data[3], 16)))
        return null;
    const object_id = exports.block_id(header.number, header.hash);
    // data := [kind(memory="01"),finalized(true="00"),difficulty,extraData,hash,logsBloom,miner,number,parentHash,receiptsRoot,signature,size,stateRoot,timestamp,totalDifficulty,transactionsRoot]
    const already_obj = await data_1.read_from_trie(trie, state_db, object_id, 0, state_1.CreateState());
    if (already_obj.data.length === 0)
        return null;
    const memory_obj = state_1.CreateState("00", constant_1.constant.ethereum, object_id, "00", input_data);
    const recover_ids = signatures.map(s => tx_set.get_recover_id_from_sign(s));
    const pub_keys = signatures.map((s, i) => crypto_set.recover(object_id, s.data, recover_ids[i]));
    const addresses = pub_keys.map(p => crypto_set.generate_address(ethereum, p));
    if (addresses.some(add => validators.indexOf(add) === -1))
        return null;
    else if (signatures.some((s, i) => !crypto_set.verify(object_id, s.data, pub_keys[i])))
        return null;
    meta_state.data[1] = header.number;
    meta_state.data[2] = header.hash;
    let height;
    let id;
    let state = memory_obj;
    let i = 1;
    let finalized_state = null;
    for (i; !big_integer_1.default(header.number, 16).lesser(i); i++) {
        height = _.bigInt2hex(big_integer_1.default(header.number, 16).subtract(i));
        id = exports.block_id(height, state.data[8]);
        state = await data_1.read_from_trie(trie, state_db, id, 0, state_1.CreateState());
        if (state.data.length === 0 || state.data[1] === "01")
            break;
        else if (state.data[1] === "00" && i >= exports.finality_height) {
            meta_state.data[3] = height;
            meta_state.data[4] = state.data[4];
            finalized_state = state;
            break;
        }
    }
    return [meta_state, memory_obj, finalized_state];
};
exports.block_id = (height, hash) => crypto_set.generate_address(ethereum, "00" + _.array2hash([height, hash]));
