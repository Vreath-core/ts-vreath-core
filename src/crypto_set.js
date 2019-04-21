"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ffi = require('../ffi-vreath/lib/index');
//import * as crypto from 'crypto'
const cryptonight = require('node-cryptonight-lite').hash;
exports.get_sha256 = (hex) => {
    return ffi.get_sha256(hex);
};
exports.generate_key = () => {
    return ffi.generate_key();
};
exports.private2public = (private_key) => {
    return ffi.private2public(private_key);
};
exports.get_shared_secret = (private_key, public_key) => {
    return ffi.get_shared_secret(private_key, public_key);
};
/*export const encrypt = (data:string,secret:string):string=>{
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let crypted = cipher.update(data, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

export const decrypt = (data:string,secret:string)=>{
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  let dec = decipher.update(data, 'hex', 'utf8');
  dec += decipher.final('utf-8');
  return dec;
}*/
exports.sign = (data, private_key) => {
    const signed = ffi.recoverable_sign(private_key, data);
    return [signed[0].toString(16), signed[1]];
};
exports.recover = (data, sign, recover_id) => {
    return ffi.recover_public_key(data, sign, recover_id);
};
exports.verify = (data, sign, public_key) => {
    return ffi.verify_sign(data, sign, public_key);
};
exports.generate_address = (token, public_key) => {
    const token_part = ("0000000000000000" + token).slice(-16);
    const hash = exports.get_sha256(exports.get_sha256(public_key));
    const key_part = ("0000000000000000000000000000000000000000000000000000000000000000" + hash).slice(-64);
    return token_part + key_part;
};
exports.compute_cryptonight = (data) => {
    const hash = cryptonight(Buffer.from(data, 'hex'));
    return hash.toString('hex');
};
