"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_set = __importStar(require("./crypto_set"));
exports.CreateLock = (address = crypto_set.generate_address("", ""), state = 0, height = "00", block_hash = crypto_set.get_sha256(""), index = 0, tx_hash = crypto_set.get_sha256("")) => {
    return {
        address: address,
        state: state,
        height: height,
        block_hash: block_hash,
        index: index,
        tx_hash: tx_hash
    };
};
