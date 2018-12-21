"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const CryptoSet = __importStar(require("./crypto_set"));
const lodash_1 = require("lodash");
exports.copy = (data) => {
    return lodash_1.cloneDeep(data);
};
exports.new_obj = (obj, fn) => {
    return fn(exports.copy(obj));
};
exports.toHash = (str) => {
    return CryptoSet.HashFromPass(str);
};
exports.Object2string = (obj) => {
    const keys = Object.keys(obj).sort();
    let result = '';
    keys.forEach(((key) => {
        let val = obj[key];
        if (typeof val === "object")
            val = exports.Object2string(val);
        result = result + val;
    }));
    return result;
};
exports.ObjectHash = (obj) => {
    const str = exports.Object2string(obj);
    return exports.toHash(str);
};
exports.Hex_to_Num = (str) => {
    return parseInt(str, 16);
};
exports.toHashNum = (str) => {
    return exports.Hex_to_Num(exports.toHash(str));
};
exports.get_unicode = (str) => {
    return str.split("").map((val) => {
        return val.charCodeAt(0);
    });
};
exports.reduce_pub = (pubs) => {
    return pubs.slice().sort().reduce((res, pub) => {
        return exports.toHash(pub + res);
    });
};
exports.get_string = (uni) => {
    return String.fromCharCode.apply({}, uni);
};
exports.object_hash_check = (hash, obj) => {
    return hash != exports.ObjectHash(obj);
};
exports.hash_size_check = (hash) => {
    return Buffer.from(hash).length != Buffer.from(exports.toHash('')).length;
};
exports.sign_check = (hash, signature, pub_key) => {
    return CryptoSet.verifyData(hash, signature, pub_key) == false;
};
exports.address_check = (address, Public, token) => {
    return address != CryptoSet.GenereateAddress(token, Public);
};
exports.time_check = (timestamp) => {
    const date = new Date();
    return timestamp > date.getTime();
};
exports.address_form_check = (address, token_name_maxsize) => {
    const splitted = address.split(":");
    return splitted.length != 3 || splitted[0] != "Vr" || Buffer.from(splitted[1]).length > token_name_maxsize;
};
