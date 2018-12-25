"use strict";
exports.__esModule = true;
var CryptoSet = require("./crypto_set");
var merkle_patricia_1 = require("./merkle_patricia");
var lodash_1 = require("lodash");
exports.copy = function (data) {
    return lodash_1.cloneDeep(data);
};
exports.new_obj = function (obj, fn) {
    return fn(exports.copy(obj));
};
exports.toHash = function (str) {
    return CryptoSet.HashFromPass(str);
};
exports.Object2string = function (obj) {
    if (obj instanceof Array) {
        return obj.reduce(function (res, val) { return res + exports.Object2string(val); }, '');
    }
    else if (obj instanceof Object) {
        return Object.entries(obj).slice().sort(function (a, b) { return Number(merkle_patricia_1.en_key(a[0]) || "0") - Number(merkle_patricia_1.en_key(b[0] || "0")); }).reduce(function (res, item) {
            var val = item[1];
            return res + exports.Object2string(val);
        }, '');
    }
    else if (['number', 'string', 'booleam'].indexOf(typeof obj) != -1)
        return String(obj);
    else
        return '';
};
exports.ObjectHash = function (obj) {
    var str = exports.Object2string(obj);
    return exports.toHash(str);
};
exports.Hex_to_Num = function (str) {
    return parseInt(str, 16);
};
exports.toHashNum = function (str) {
    return exports.Hex_to_Num(exports.toHash(str));
};
exports.get_unicode = function (str) {
    return str.split("").map(function (val) {
        return val.charCodeAt(0);
    });
};
exports.reduce_pub = function (pubs) {
    return pubs.slice().sort().reduce(function (res, pub) {
        return exports.toHash(pub + res);
    }) || '';
};
exports.get_string = function (uni) {
    return String.fromCharCode.apply({}, uni);
};
exports.object_hash_check = function (hash, obj) {
    return hash != exports.ObjectHash(obj);
};
exports.hash_size_check = function (hash) {
    return Buffer.from(hash).length != Buffer.from(exports.toHash('')).length;
};
exports.sign_check = function (hash, signature, pub_key) {
    return CryptoSet.verifyData(hash, signature, pub_key) == false;
};
exports.address_check = function (address, Public, token) {
    return address != CryptoSet.GenereateAddress(token, Public);
};
exports.time_check = function (timestamp) {
    var date = new Date();
    return timestamp > Math.floor(date.getTime() / 1000);
};
exports.address_form_check = function (address, token_name_maxsize) {
    var splitted = address.split(":");
    return splitted.length != 3 || splitted[0] != "Vr" || Buffer.from(splitted[1]).length > token_name_maxsize;
};
