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
const Err = __importStar(require("./error"));
const crypto_set = __importStar(require("./crypto_set"));
const lodash_1 = require("lodash");
const big_integer_1 = __importDefault(require("big-integer"));
exports.copy = (data) => {
    return lodash_1.cloneDeep(data);
};
exports.new_obj = (obj, fn) => {
    return fn(exports.copy(obj));
};
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
exports.bigInt2hex = (bigint) => {
    let hex = bigint.toString(16);
    if (hex.length % 2 != 0)
        hex = "0" + hex;
    return hex;
};
exports.hex_sum = (hexes) => {
    const sum_hex = hexes.reduce((sum, hex) => {
        return sum.add(big_integer_1.default(hex, 16));
    }, big_integer_1.default(0));
    return exports.bigInt2hex(sum_hex);
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
exports.slice_token_part = (address) => {
    return address.slice(0, 16);
};
exports.slice_hash_part = (address) => {
    return address.slice(16, 80);
};
exports.hash_size_check = (hash) => {
    return Buffer.from(hash).length != Buffer.from(crypto_set.get_sha256('')).length;
};
exports.sign_check = (hash, signature, public_key) => {
    return crypto_set.verify(hash, signature, public_key) == false;
};
exports.hashed_pub_check = (address, pubs) => {
    return address.slice(16, 80) != crypto_set.get_sha256(crypto_set.get_sha256(exports.reduce_pub(pubs)));
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
exports.slice_tokens = (addresses) => {
    return addresses.reduce((res, add) => {
        const sliced = exports.slice_token_part(add);
        if (res.indexOf(sliced) === -1)
            return res.concat(sliced);
        else
            return res;
    }, []);
};
class Result {
    constructor(ok, err) {
        this.ok = ok;
        this.err = err;
    }
}
class Hex {
    constructor(_value, _size, _variable_length) {
        this._value = _value;
        this._size = _size;
        this._variable_length = _variable_length;
        this.value = _value;
        this.size = _size;
        this.variable_length = _variable_length;
    }
    form_verify() {
        if (this.value == null || typeof this.value != 'string' || Buffer.from(this.value, 'hex').length * 2 != this.value.length || this.value.length % 2 != 0)
            return new Result(false, new Err.HexError("invalid hex value"));
        if (this.size != null && ((this.variable_length != true && this.value.length != this.size * 2) || (this.variable_length === true && this.value.length > this.size * 2)))
            return new Result(false, new Err.HexError("hex doesn't meet the constraint"));
        const array = this.value.split('');
        const exp = new RegExp('[a-f0-9]');
        const exp_test = array.some(str => {
            return !exp.test(str);
        });
        if (exp_test)
            return new Result(false, new Err.HexError("hex doesn't meet regexp"));
        else
            return new Result(true);
    }
    print() {
        console.log(this.value);
    }
    to_num() {
        return parseInt(this.value, 16);
    }
    to_str() {
        //if(hex.length%2!=0) hex = "0"+hex;
        return this.value;
    }
    eq(another) {
        return big_integer_1.default(this.value, 16).eq(big_integer_1.default(another.value, 16));
    }
    larger(another) {
        return !big_integer_1.default(this.value, 16).lesserOrEquals(big_integer_1.default(another.value, 16));
    }
    largerOrEq(another) {
        return !big_integer_1.default(this.value, 16).lesser(big_integer_1.default(another.value, 16));
    }
    smaller(another) {
        return big_integer_1.default(this.value, 16).lesser(big_integer_1.default(another.value, 16));
    }
    smallerOrEq(another) {
        return big_integer_1.default(this.value, 16).lesserOrEquals(big_integer_1.default(another.value, 16));
    }
}
exports.Hex = Hex;
class HexArithmetic {
    constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new HexArithmetic();
        }
        return this._instance;
    }
    bigInt2hex(bigint) {
        let hex = bigint.toString(16);
        if (hex.length % 2 != 0)
            hex = "0" + hex;
        return hex;
    }
    get_size(str) {
        const len = str.length;
        return Math.floor(len / 2);
    }
    abst(one, two, fn_name) {
        const fn = big_integer_1.default(one.to_str(), 16)[fn_name];
        const new_value = fn(big_integer_1.default(two.to_str(), 16));
        const str = this.bigInt2hex(new_value);
        const size = this.get_size(str);
        const hex = new Hex(str, size, true);
        const verified = hex.form_verify();
        if (verified.ok === false && verified.err != null)
            return new Result(hex, verified.err);
        else
            return new Result(hex);
    }
    add(one, two) {
        return this.abst(one, two, 'add');
    }
    sub(one, two) {
        return this.abst(one, two, 'subtract');
    }
    mul(one, two) {
        return this.abst(one, two, 'multiply');
    }
    div(one, two) {
        return this.abst(one, two, 'divide');
    }
    mod(one, two) {
        return this.abst(one, two, 'mod');
    }
}
exports.HexArithmetic = HexArithmetic;
