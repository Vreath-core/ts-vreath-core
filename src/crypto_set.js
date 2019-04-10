"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const wasm = __importStar(require("wasm-vreath"));
const crypto = __importStar(require("crypto"));
const cryptonight = require('node-cryptonight-lite').hash;
exports.hex2u8_array = (hex) => {
    return Uint8Array.from(Buffer.from(hex, 'hex'));
};
exports.u8_array2hex = (u8_array) => {
    return Buffer.from(u8_array).toString('hex');
};
exports.get_sha256 = (hex) => {
    let input = exports.hex2u8_array(hex);
    return wasm.wasm_get_sha256(input);
};
exports.generate_key = () => {
    let randoms = [];
    let i;
    for (i = 0; i < 32; i++) {
        randoms[i] = Math.floor(Math.random() * 256);
    }
    return wasm.wasm_generate_key(Uint8Array.from(randoms));
};
exports.private2public = (private_key) => {
    const private_array = exports.hex2u8_array(private_key);
    return wasm.wasm_private2public(private_array);
};
exports.get_shared_secret = (private_key, public_key) => {
    const private_array = exports.hex2u8_array(private_key);
    const public_array = exports.hex2u8_array(public_key);
    return wasm.wasm_get_shared_secret(private_array, public_array);
};
exports.encrypt = (data, secret) => {
    const cipher = crypto.createCipher('aes-256-cbc', secret);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};
exports.decrypt = (data, secret) => {
    const decipher = crypto.createDecipher('aes-256-cbc', secret);
    let dec = decipher.update(data, 'hex', 'utf8');
    dec += decipher.final('utf-8');
    return dec;
};
exports.sign = (data, private_key) => {
    const data_array = exports.hex2u8_array(data);
    const private_array = exports.hex2u8_array(private_key);
    const signed = wasm.wasm_recoverable_sign(private_array, data_array);
    const splited = signed.split('_');
    const recover_id = Number(splited[0]);
    const sign = splited[1];
    return [recover_id, sign];
};
exports.recover = (data, sign, recover_id) => {
    const data_array = exports.hex2u8_array(data);
    const sign_array = exports.hex2u8_array(sign);
    return wasm.wasm_recover_public_key(data_array, sign_array, recover_id);
};
exports.verify = (data, sign, public_key) => {
    const data_array = exports.hex2u8_array(data);
    const sign_array = exports.hex2u8_array(sign);
    const public_array = exports.hex2u8_array(public_key);
    const verify = wasm.wasm_verify_sign(data_array, sign_array, public_array);
    return verify;
};
exports.generate_address = (token, public_key) => {
    const token_part = ("0000000000" + token).slice(-12);
    const hash = exports.get_sha256(exports.get_sha256(public_key));
    const key_part = ("00000000000000000000" + hash).slice(-20);
    return token_part + key_part;
};
exports.compute_cryptonight = (data) => {
    const hash = cryptonight(Buffer.from(data, 'hex'));
    return hash.toString('hex');
};
