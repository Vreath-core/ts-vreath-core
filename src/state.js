"use strict";
exports.__esModule = true;
var _ = require("./basic");
var CryptoSet = require("./crypto_set");
exports.CreateState = function (nonce, owner, token, amount, data) {
    if (nonce === void 0) { nonce = 0; }
    if (owner === void 0) { owner = CryptoSet.GenereateAddress("", _.toHash("")); }
    if (token === void 0) { token = ""; }
    if (amount === void 0) { amount = 0; }
    if (data === void 0) { data = {}; }
    return {
        kind: "state",
        nonce: nonce,
        token: token,
        owner: owner,
        amount: amount,
        data: data,
        issued: 0,
        code: _.toHash('')
    };
};
exports.CreateInfo = function (nonce, token, issued, code) {
    if (nonce === void 0) { nonce = 0; }
    if (token === void 0) { token = ""; }
    if (issued === void 0) { issued = 0; }
    if (code === void 0) { code = _.toHash(''); }
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
