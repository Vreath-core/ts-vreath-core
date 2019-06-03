"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ffi = require('../ffi-vreath/lib/index');
const _ = __importStar(require("./util"));
const Err = __importStar(require("./error"));
const result_1 = require("./result");
const cryptonight = require('node-cryptonight-lite').hash;
/*export const get_sha256 = (hex:string):string=>{
  return ffi.get_sha256(hex);
}

export const generate_key = ():string=>{
  return ffi.generate_key();
}

export const private2public = (private_key:string):string=>{
  return ffi.private2public(private_key);
}

export const get_shared_secret = (private_key:string,public_key:string):string=>{
  return ffi.get_shared_secret(private_key,public_key);
}

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
/*export const sign = (data:string,private_key:string):[string,string]=>{
  const signed = ffi.recoverable_sign(private_key,data);
  return [signed[0].toString(16),signed[1]];
}

export const recover = (data:string,sign:string,recover_id:number):string=>{
  return ffi.recover_public_key(data,sign,recover_id);
}


export const verify = (data:string,sign:string,public_key:string):boolean=>{
  return ffi.verify_sign(data,sign,public_key);
}

export const generate_address = (token:string,public_key:string):string=>{
    const token_part = ("0000000000000000"+token).slice(-16);
    const hash = get_sha256(get_sha256(public_key));
    const key_part = ("0000000000000000000000000000000000000000000000000000000000000000"+hash).slice(-64);
    return token_part+key_part;
}

export const compute_cryptonight = (data:string):string=>{
  const hash = cryptonight(Buffer.from(data,'hex'));
  return hash.toString('hex');
}*/
const array2hash = (array) => {
    const concated = array.reduce((res, str) => {
        return res + str;
    }, '');
    return ffi.get_sha256(concated);
};
const reduce_pub = (pubs) => {
    if (pubs.length === 0)
        return ffi.get_sha256('');
    else if (pubs.length === 1)
        return pubs[0];
    else
        return array2hash(pubs);
};
class Hash extends _.Hex {
    constructor(_value = _.HexFactory.instance.zero(32).value) {
        super(_value, 32, false);
    }
    verify(seed) {
        try {
            const hash = ffi.get_sha256(seed.value);
            const hex = new _.Hex(hash, 32, false);
            if (super.eq(hex))
                return new result_1.Result(true);
            else
                return new result_1.Result(false, new Err.HashError("computed hash doesn't match"));
        }
        catch (e) {
            return new result_1.Result(false, new Err.HashError("fail to compute hash"));
        }
    }
    verify_for_mining(seed) {
        try {
            const hash = cryptonight(Buffer.from(seed.value, 'hex'));
            const hex = new _.Hex(hash, 32, false);
            if (super.eq(hex))
                return new result_1.Result(true);
            else
                return new result_1.Result(false, new Err.HashError("computed hash for mining doesn't match"));
        }
        catch (e) {
            return new result_1.Result(false, new Err.HashError("fail to compute hash for mining"));
        }
    }
}
exports.Hash = Hash;
class HashFactory {
    constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new HashFactory();
        }
        return this._instance;
    }
    from_hex(hex) {
        const hash_val = ffi.get_sha256(hex.value);
        const hash = new Hash(hash_val);
        const verified = hash.form_verify();
        if (verified.ok)
            return new result_1.Result(hash);
        else
            return new result_1.Result(hash, new Err.HashError("A produced hash has invalid form of hex"));
    }
    for_mining(hex) {
        const hash_val = cryptonight(Buffer.from(hex.value, 'hex'));
        const hash = new Hash(hash_val);
        const verified = hash.form_verify();
        if (verified.ok)
            return new result_1.Result(hash);
        else
            return new result_1.Result(hash, new Err.HashError("A produced hash for mining has invalid form of hex"));
    }
    from_array(hexes) {
        const new_val = array2hash(hexes.map(hex => hex.value));
        const hash = new Hash(new_val);
        const verified = hash.form_verify();
        if (verified.ok)
            return new result_1.Result(hash);
        else
            return new result_1.Result(hash, new Err.HashError("A produced hash from array has invalid form of hex"));
    }
}
exports.HashFactory = HashFactory;
class PrivateKey extends _.Hex {
    constructor(_value = _.HexFactory.instance.zero(32).value) {
        super(_value, 32, false);
    }
}
exports.PrivateKey = PrivateKey;
class PrivateFactory {
    constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new PrivateFactory();
        }
        return this._instance;
    }
    generate() {
        const value = ffi.generate_key();
        return new PrivateKey(value);
    }
}
exports.PrivateFactory = PrivateFactory;
class PublicKey extends _.Hex {
    constructor(_value = _.HexFactory.instance.zero(33).value) {
        super(_value, 33, false);
    }
}
exports.PublicKey = PublicKey;
class PublicKeyFactory {
    constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new PublicKeyFactory();
        }
        return this._instance;
    }
    from_privKey(privKey) {
        const value = ffi.private2public(privKey.value);
        return new PublicKey(value);
    }
}
exports.PublicKeyFactory = PublicKeyFactory;
class Addrees extends _.Hex {
    constructor(_value = _.HexFactory.instance.zero(40).value) {
        super(_value, 40, false);
    }
    slice_token_part() {
        const value = super.value.slice(0, 16);
        const token_key = new _.TokenKey(value);
        return token_key;
    }
    slice_hash_part() {
        const value = super.value.slice(16, 80);
        const hash = new Hash(value);
        return hash;
    }
    verify_hashed_pub(pubs) {
        const val_from_other = ffi.get_sha256(ffi.get_sha256(reduce_pub(pubs.map(pub => pub.value))));
        const val_from_mine = this.slice_hash_part().value;
        if (val_from_other === val_from_mine) {
            return new result_1.Result(true);
        }
        else {
            return new result_1.Result(false, new Err.AddressError("invalid hashed pub in the address"));
        }
    }
    verify(token, pubKeys) {
        const fact = AddressFactory.instance;
        const valid_hash = fact.from_pubKeys(token, pubKeys);
        if (valid_hash.err)
            return new result_1.Result(false, valid_hash.err);
        else if (!super.eq(valid_hash.ok))
            return new result_1.Result(false, new Err.AddressError("address doesn't match"));
        else
            return new result_1.Result(true);
    }
}
exports.Addrees = Addrees;
class AddressFactory {
    constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new AddressFactory();
        }
        return this._instance;
    }
    from_pubKeys(token, pubKeys) {
        const reduced_pub_val = reduce_pub(pubKeys.map(pub => pub.value));
        const hashed_pub = ffi.get_sha256(ffi.get_sha256(reduced_pub_val));
        const value = token.value + hashed_pub;
        const address = new Addrees(value);
        const verified = address.form_verify();
        if (verified.ok)
            return new result_1.Result(address);
        else
            return new result_1.Result(address, new Err.AddressError("fail to create new address because of invalid form"));
    }
}
exports.AddressFactory = AddressFactory;
class SignData extends _.Hex {
    constructor(_value = _.HexFactory.instance.zero(64).value) {
        super(_value, 64, false);
    }
}
exports.SignData = SignData;
class SignV extends _.Hex {
    constructor(_value = _.HexFactory.instance.zero(6).value) {
        super(_value, 6, false);
    }
}
exports.SignV = SignV;
class Sign {
    constructor(_data = new SignData(), _v = new SignV()) {
        this.data = _data;
        this.v = _v;
    }
    verify(data, pubKey) {
        const verified = ffi.verify_sign(data.value, this.data.value, pubKey.value);
        if (verified)
            return new result_1.Result(true);
        else
            return new result_1.Result(false, new Err.SignError("invalid sign"));
    }
    recover(data) {
        const recovered = ffi.recover_public_key(data.value, this.data.value, this.v.value);
        const pubKey = new PublicKey(recovered);
        const verified = pubKey.form_verify();
        if (verified.ok)
            return new result_1.Result(pubKey);
        else
            return new result_1.Result(pubKey, new Err.SignError("fail to recover pubKey"));
    }
}
exports.Sign = Sign;
