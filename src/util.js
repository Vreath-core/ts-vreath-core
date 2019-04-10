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
const crypto_set = __importStar(require("./crypto_set"));
//import {en_key} from './merkle_patricia'
const lodash_1 = require("lodash");
const big_integer_1 = __importDefault(require("big-integer"));
exports.copy = (data) => {
    return lodash_1.cloneDeep(data);
};
exports.new_obj = (obj, fn) => {
    return fn(exports.copy(obj));
};
/*
export const object2string = <T>(obj:{[key:string]:T}|T[]|T):string=>{
  if(obj instanceof Array){
    return obj.reduce((res:string,val)=>res+object2string(val),'');
  }
  else if(obj instanceof Object){
    return Object.entries(obj).slice().sort((a,b)=>Number(en_key(a[0])||"0")-Number(en_key(b[0]||"0"))).reduce((res:string,item)=>{
      const val:T = item[1];
      return res+object2string(val);
    },'');
  }
  else if(['number','string','booleam'].indexOf(typeof obj)!=-1) return String(obj);
  else return '';
}

export const object2hash = <T>(obj:{[key:string]:T}|T[])=>{
  const str = object2string(obj);
  return crypto_set.get_sha256(str);
}*/
exports.hex2num = (str) => {
    return parseInt(str, 16);
};
exports.hash_num = (str) => {
    return exports.hex2num(crypto_set.get_sha256(str));
};
exports.get_unicode = (str) => {
    return str.split("").map((val) => {
        return val.charCodeAt(0);
    });
};
exports.hex_sum = (hexes) => {
    const sum_hex = hexes.reduce((sum, hex) => {
        return sum.add(big_integer_1.default(hex, 16));
    }, big_integer_1.default(0));
    return sum_hex.toString(16);
};
exports.array2hash = (array) => {
    const concated = array.reduce((res, str) => {
        return res + str;
    }, '');
    return crypto_set.get_sha256(concated);
};
exports.reduce_pub = (pubs) => {
    if (pubs.length === 0)
        return crypto_set.get_sha256('');
    else if (pubs.length === 1)
        return pubs[0];
    else
        return exports.array2hash(pubs);
};
exports.get_string = (uni) => {
    return String.fromCharCode.apply({}, uni);
};
exports.hash_size_check = (hash) => {
    return Buffer.from(hash).length != Buffer.from(crypto_set.get_sha256('')).length;
};
exports.sign_check = (hash, signature, public_key) => {
    return crypto_set.verify(hash, signature, public_key) == false;
};
exports.hashed_pub_check = (address, pubs) => {
    return address.slice(16, 80) != crypto_set.get_sha256(exports.reduce_pub(pubs));
};
exports.address_check = (address, public_key, token) => {
    return address != crypto_set.generate_address(token, public_key);
};
exports.address_form_check = (address) => {
    return Buffer.from(address, 'hex').length * 2 != address.length || Buffer.from(address).length != 80;
};
exports.time_check = (timestamp) => {
    const date = new Date();
    return timestamp > Math.floor(date.getTime() / 1000);
};
exports.slice_token_part = (address) => {
    return address.slice(0, 16);
};
exports.slice_hash_part = (address) => {
    return address.slice(16, 80);
};
exports.slice_tokens = (addresses) => {
    return addresses.reduce((res, add) => {
        const sliced = exports.slice_token_part(add);
        if (res.indexOf(sliced) === -1)
            return res.concat(sliced);
        else
            return res;
    }, []);
};
