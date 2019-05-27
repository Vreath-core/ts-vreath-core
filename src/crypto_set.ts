const ffi = require('../ffi-vreath/lib/index');
import * as T from './types'
import * as _ from './util'
const cryptonight = require('node-cryptonight-lite').hash;

export const get_sha256 = (hex:string):string=>{
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


export const sign = (data:string,private_key:string):[string,string]=>{
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
}

export class Hash implements T.Hash {
  private value:string;
  private size:32 = 32;
  private valriable_length:false = false;
  constructor(_value:string){
    this.value = _value;
  }
  from_hex(hex:T.Hex){
    const hash:string = ffi.get_sha256(hex);
    this.value = hash;
  }
}

export class PrivateKey extends _.Hex implements T.PrivateKey {
  constructor(_value:string){
    super(_value,32,false);
  }

  generate() {
    const privKey:string = ffi.generate_key();
    super.value = privKey;
  }
}

export class PublicKey implements T.PublicKey {
  private value:string;
  private size:33 = 33;
  private valriable_length:false = false;
  constructor(_value:string){
    this.value = _value;
  }
}

export class SignData implements T.SignData {
  private value:string;
  private size:64 = 64;
  private valriable_length:false = false;
  constructor(_value:string){
    this.value = _value;
  }
}

export class SignV implements T.SignV {
  private value:string;
  private size:6 = 6;
  private valriable_length:false = false;
  constructor(_value:string){
    this.value = _value;
  }
}

