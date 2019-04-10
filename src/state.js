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
exports.CreateState = (nonce = "0", token = "0", owner = crypto_set.generate_address("", ""), amount = "0", data = []) => {
    return {
        nonce: nonce,
        token: token,
        owner: owner,
        amount: amount,
        data: data
    };
};
exports.CreateToken = (nonce = "0", name = "0", issued = "0", code = crypto_set.get_sha256("")) => {
    return {
        nonce: nonce,
        name: name,
        issued: issued,
        code: code
    };
};
