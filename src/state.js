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
exports.CreateState = (nonce = 0, owner = CryptoSet.GenereateAddress("", _.toHash("")), token = "", amount = 0, data = {}) => {
    return {
        kind: "state",
        nonce: nonce,
        token: token,
        owner: owner,
        amount: amount,
        data: data,
        issued: 0,
        code: ""
    };
};
exports.CreateInfo = (nonce = 0, token = "", issued = 0, code = "") => {
    return {
        kind: "info",
        nonce: nonce,
        token: token,
        owner: '',
        amount: 0,
        data: {},
        issued: issued,
        code: code
    };
};
