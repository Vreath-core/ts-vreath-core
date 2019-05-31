const ffi = require('../ffi-vreath/lib/index');
import * as T from './types'
import * as _ from './util'
import * as Err from './error'
import {Result} from './result'
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

export interface IHash extends _.IHex {
  verify(seed:_.IHex):Result<boolean,Err.AddressError>;
  verify_for_mining(seed:_.IHex):Result<boolean,Err.AddressError>;
}


export interface IHashFactory {
  from_hex(hex:_.IHex):Result<IHash,Err.HashError>;
  for_mining(hex:_.IHex):Result<IHash,Err.HashError>;
}

export interface IPrivateKey extends _.IHex {}

export interface IPrivateKeyFactory {
  generate():IPrivateKey;
}

export interface IPublicKey extends _.IHex {}

export interface IPublicKeyFactory {
  from_privKey(privKey:IPrivateKey):IPublicKey;
  reduce_pub(pubs:IPublicKey[]):IPublicKey;
}

export interface IAddress extends _.IHex {
  /*readonly size:40;
  readonly valriable_length:false;*/
  slice_token_part():_.ITokenKey;
  slice_hash_part():IHash;
  hashed_pub_check(pub:string):Result<boolean,Err.AddressError>;
  form_check():Result<boolean,Err.AddressError>;
  check(pub:IPublicKey,token:_.ITokenKey):Result<boolean,Err.AddressError>;
}

export interface IAddressFactory {
  from_pubKey(pubKey:IPublicKey):IAddress;
}

export interface ISignData extends _.IHex {
  //readonly size:64;
  //readonly valriable_length:false;
}

export interface ISignV extends _.IHex {
  //readonly size:6;
  //readonly valriable_length:false;
}

export interface ISign {
  //readonly data:SignData//64 byte
  //readonly v:SignV;//6 byte
  verify(data:IHash,pubKey:IPublicKey):Result<boolean,Err.SignError>;
  recover(data:IHash):Result<IPublicKey,Err.SignError>
}

export interface ISignFactory {
  sign(data:IHash,privKey:IPrivateKey):ISign;
}
/*
export class Hash extends _.Hex implements IHash {
  constructor(_value:string){
    super(_value,32,false);
  }

  public verify(seed:_.IHex):Result<boolean,Err.HashError>{
    try{
      const hash:string = ffi.get_sha256(seed.value);
      const hex = new _.Hex(hash,32,false);
      if(super.eq(hex)) return new Result(true);
      else return new Result(false,new Err.HashError("computed hash doesn't match"));
    }
    catch(e){
      return new Result(false,new Err.HashError("fail to compute hash"));
    }
  }

  public verify_for_mining(seed:_.IHex):Result<boolean,Err.HashError>{
    try{
      const hash:string = cryptonight(Buffer.from(seed.value,'hex'));
      const hex = new _.Hex(hash,32,false);
      if(super.eq(hex)) return new Result(true);
      else return new Result(false,new Err.HashError("computed hash for mining doesn't match"));
    }
    catch(e){
      return new Result(false,new Err.HashError("fail to compute hash for mining"));
    }
  }
}

export class HashFactory implements IHashFactory {
  private static _instance:HashFactory;
  private constructor(){}
  public static get instance():HashFactory{
    if (!this._instance) {
      this._instance = new HashFactory();
    }
    return this._instance;
  }

  public from_hex(hex:_.IHex):Result<IHash,Err.HashError>{
    const hash_val:string = ffi.get_sha256(hex.value);
    const hash = new Hash(hash_val);
    const verified = hash.form_verify();
    if(verified.ok) return new Result(hash);
    else return new Result(hash,new Err.HashError("A produced hash is against form of hex"))
  }

  public for_mining(hex:_.IHex):Result<IHash,Err.HashError>{
    const hash_val:string = cryptonight(Buffer.from(hex.value,'hex'));
    const hash = new Hash(hash_val);
    const verified = hash.form_verify();
    if(verified.ok) return new Result(hash);
    else return new Result(hash,new Err.HashError("A produced hash for mining is against form of hex"))
  }
}

export class PrivateKey extends _.Hex implements IPrivateKey {
  constructor(_value:string){
    super(_value,32,false);
  }
}

export class PrivateFactory implements IPrivateKeyFactory {
  private static _instance:PrivateFactory;
  private constructor(){}
  public static get instance():PrivateFactory{
    if (!this._instance) {
      this._instance = new PrivateFactory();
    }
    return this._instance;
  }

  public generate(){
    const value:string = ffi.generate_key();
    return new PrivateKey(value);
  }
}

export class PublicKey extends _.Hex implements IPublicKey {
  constructor(_value:string){
    super(_value,33,false);
  }
}

export class PublicKeyFactory implements IPublicKeyFactory {
  private static _instance:PublicKeyFactory;
  private constructor(){}
  public static get instance():PublicKeyFactory{
    if (!this._instance) {
      this._instance = new PublicKeyFactory();
    }
    return this._instance;
  }

  from_privKey(privKey:IPrivateKey){
    const value:string = ffi.private2public(privKey.value);
    return new PublicKey(value);
  }

  reduce_pub(pubs:IPublicKey[]){
    let value:string
    if(pubs.length===0) return crypto_set.get_sha256('');
    else if(pubs.length===1) return pubs[0];
    else return array2hash(pubs);
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

*/