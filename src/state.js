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
exports.CreateState = (nonce = "0x0", token = "0x0", owner = crypto_set.generate_address("", ""), amount = "0x0", data = []) => {
    return {
        nonce: nonce,
        token: token,
        owner: owner,
        amount: amount,
        data: data
    };
};
exports.CreateToken = (nonce = "0x0", name = "0x0", issued = "0x0", code = crypto_set.get_sha256("")) => {
    return {
        nonce: nonce,
        name: name,
        issued: issued,
        code: code
    };
};
