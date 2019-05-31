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
const result_1 = require("./result");
const big_integer_1 = __importDefault(require("big-integer"));
/*export const copy = <T>(data:T)=>{
  return cloneDeep(data);
}

export const new_obj = <T>(obj:T,fn:(obj:T)=>T)=>{
  return fn(copy(obj));
}

export const hex2num = (str:string):number=>{
  return parseInt(str,16);
}

export const hash_num = (str:string):number=>{
  return hex2num(crypto_set.get_sha256(str));
}

export const get_unicode = (str:string):number[]=>{
  return str.split("").map((val)=>{
    return val.charCodeAt(0);
  });
}

export const bigInt2hex = (bigint:BigInteger):string=>{
  let hex = bigint.toString(16);
  if(hex.length%2!=0) hex = "0"+hex;
  return hex;
}

export const hex_sum = (hexes:string[]):string=>{
  const sum_hex = hexes.reduce((sum:BigInteger,hex:string)=>{
    return sum.add(bigInt(hex,16));
  },bigInt(0));
  return bigInt2hex(sum_hex);
}

export const array2hash = (array:string[]):string=>{
  const concated = array.reduce((res:string,str)=>{
    return res+str;
  },'');
  return crypto_set.get_sha256(concated);
}

export const reduce_pub = (pubs:string[])=>{
  if(pubs.length===0) return crypto_set.get_sha256('');
  else if(pubs.length===1) return pubs[0];
  else return array2hash(pubs);
}

export const get_string = (uni:number[]):string=>{
  return String.fromCharCode.apply({},uni);
}

export const slice_token_part = (address:string)=>{
  return address.slice(0,16);
}

export const slice_hash_part = (address:string)=>{
  return address.slice(16,80);
}

export const hash_size_check = (hash:string)=>{
  return Buffer.from(hash).length!=Buffer.from(crypto_set.get_sha256('')).length;
}

export const sign_check = (hash:string,signature:string,public_key:string)=>{
  return crypto_set.verify(hash,signature,public_key)==false
}

export const hashed_pub_check = (address:string,pubs:string[])=>{
    return address.slice(16,80)!=crypto_set.get_sha256(crypto_set.get_sha256(reduce_pub(pubs)));
}

export const address_check = (address:string,public_key:string,token:string)=>{
  return address!=crypto_set.generate_address(token,public_key);
}

export const address_form_check = (address:string)=>{
    return Buffer.from(address,'hex').length*2!=address.length || Buffer.from(address).length!=80;
}


export const time_check = (timestamp:number)=>{
  const date = new Date();
  return timestamp>Math.floor(date.getTime()/1000);
}

export const slice_tokens = (addresses:string[])=>{
  return addresses.reduce((res:string[],add)=>{
    const sliced = slice_token_part(add);
    if(res.indexOf(sliced)===-1) return res.concat(sliced);
    else return res;
  },[]);
}*/
const bigInt2hex = (bigint) => {
    let hex = bigint.toString(16);
    if (hex.length % 2 != 0)
        hex = "0" + hex;
    return hex;
};
class Hex {
    constructor(_value, _size, _variable_length) {
        this.value = _value;
        this.size = _size;
        this.variable_length = _variable_length;
    }
    form_verify() {
        if (this.value == null || typeof this.value != 'string' || Buffer.from(this.value, 'hex').length * 2 != this.value.length || this.value.length % 2 != 0)
            return new result_1.Result(false, new Err.HexError("invalid hex value"));
        if (this.size != null && ((this.variable_length != true && this.value.length != this.size * 2) || (this.variable_length === true && this.value.length > this.size * 2)))
            return new result_1.Result(false, new Err.HexError("hex doesn't meet the constraint"));
        const array = this.value.split('');
        const exp = new RegExp('[a-f0-9]');
        const exp_test = array.some(str => {
            return !exp.test(str);
        });
        if (exp_test)
            return new result_1.Result(false, new Err.HexError("hex doesn't meet regexp"));
        else
            return new result_1.Result(true);
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
class HexFactory {
    constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new HexFactory();
        }
        return this._instance;
    }
    from_number(num, valriable_length) {
        try {
            let value = num.toString(16);
            if (value.length % 2 != 0)
                value = "0" + value;
            return new result_1.Result(new Hex(value, Math.floor(value.length), valriable_length));
        }
        catch (e) {
            return new result_1.Result(new Hex("", 0, false), new Err.HexError(e));
        }
    }
    from_bigInt(bigint, valriable_length) {
        try {
            const value = bigInt2hex(bigint);
            return new result_1.Result(new Hex(value, Math.floor(value.length / 2), valriable_length));
        }
        catch (e) {
            return new result_1.Result(new Hex("", 0, false), new Err.HexError(e));
        }
    }
}
exports.HexFactory = HexFactory;
class HexArithmetic {
    constructor(_value) {
        this.value = _value;
    }
    get_size(str) {
        const len = str.length;
        return Math.floor(len / 2);
    }
    abst(another, fn_name) {
        if (another instanceof result_1.Result && another.err != null)
            return another;
        const ano_val = another instanceof result_1.Result ? another.ok : another;
        const fn = big_integer_1.default(this.value.to_str(), 16)[fn_name];
        const new_value = fn(big_integer_1.default(ano_val.to_str(), 16));
        const str = bigInt2hex(new_value);
        const size = this.get_size(str);
        const hex = new Hex(str, size, true);
        const verified = hex.form_verify();
        if (verified.ok === false && verified.err != null)
            return new result_1.Result(hex, verified.err);
        else
            return new result_1.Result(hex);
    }
    add(another) {
        return this.abst(another, 'add');
    }
    sub(another) {
        return this.abst(another, 'subtract');
    }
    mul(another) {
        return this.abst(another, 'multiply');
    }
    div(another) {
        return this.abst(another, 'divide');
    }
    mod(another) {
        return this.abst(another, 'mod');
    }
}
exports.HexArithmetic = HexArithmetic;
class Counter extends Hex {
    constructor(_value) {
        super(_value, 8, false);
    }
}
exports.Counter = Counter;
class TokenKey extends Hex {
    constructor(_value) {
        super(_value, 8, false);
    }
}
exports.TokenKey = TokenKey;
class Amount extends Hex {
    constructor(_value) {
        super(_value, 10, false);
    }
}
exports.Amount = Amount;
class FreeHex extends Hex {
    constructor(_value, _size) {
        super(_value, _size, true);
    }
}
exports.FreeHex = FreeHex;
class Uint {
    constructor(_value) {
        this.value = _value;
    }
    form_verify() {
        if (this.value == null || typeof this.value != 'number' || !Number.isInteger(this.value) || this.value < 0)
            return new result_1.Result(false, new Err.UintError("invalid uint"));
        else
            return new result_1.Result(true);
    }
    eq(another) {
        return this.value === another.value;
    }
    larger(another) {
        return this.value > another.value;
    }
    largerOrEq(another) {
        return this.value >= another.value;
    }
    smaller(another) {
        return this.value < another.value;
    }
    smallerOrEq(another) {
        return this.value <= another.value;
    }
}
exports.Uint = Uint;
class Timestamp extends Uint {
    constructor(_value) {
        super(_value);
    }
    form_verify() {
        if (super.form_verify().ok === false)
            return new result_1.Result(false, new Err.TimestampError("invalid timestamp because of the form as uint"));
        else if (super.value.toString(10).length != 10)
            return new result_1.Result(false, new Err.TimestampError("invalid timestamp because of the size"));
        else
            return new result_1.Result(true);
    }
}
exports.Timestamp = Timestamp;
