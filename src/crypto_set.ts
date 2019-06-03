const ffi = require('../ffi-vreath/lib/index');
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
const array2hash = (array:string[]):string=>{
  const concated = array.reduce((res:string,str)=>{
    return res+str;
  },'');
  return ffi.get_sha256(concated);
}

const reduce_pub = (pubs:string[])=>{
  if(pubs.length===0) return ffi.get_sha256('');
  else if(pubs.length===1) return pubs[0];
  else return array2hash(pubs);
}

export interface IHash extends _.IHex {
  verify(seed:_.IHex):Result<boolean,Err.AddressError>;
  verify_for_mining(seed:_.IHex):Result<boolean,Err.AddressError>;
}


export interface IHashFactory {
  from_hex(hex:_.IHex):Result<IHash,Err.HashError>;
  for_mining(hex:_.IHex):Result<IHash,Err.HashError>;
  from_array(hexes:_.IHex[]):Result<IHash,Err.HashError>;
}

export interface IPrivateKey extends _.IHex {}

export interface IPrivateKeyFactory {
  generate():IPrivateKey;
}

export interface IPublicKey extends _.IHex {}

export interface IPublicKeyFactory {
  from_privKey(privKey:IPrivateKey):IPublicKey;
}

export interface IAddress extends _.IHex {
  /*readonly size:40;
  readonly valriable_length:false;*/
  slice_token_part():_.ITokenKey;
  slice_hash_part():IHash;
  verify_hashed_pub(pubs:IPublicKey[]):Result<boolean,Err.AddressError>;
  verify(token:_.ITokenKey,pubKeys:IPublicKey[]):Result<boolean,Err.AddressError>;
}

export interface IAddressFactory {
  from_pubKeys(token:_.ITokenKey,pubKeys:IPublicKey[]):Result<IAddress,Err.AddressError>;
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
  readonly data:SignData//64 byte
  readonly v:SignV;//6 byte
  verify(data:IHash,pubKey:IPublicKey):Result<boolean,Err.SignError>;
  recover(data:IHash):Result<IPublicKey,Err.SignError>
}

export interface ISignFactory {
  sign(data:IHash,privKey:IPrivateKey):ISign;
}



export class Hash extends _.Hex implements IHash {
  constructor(_value:string=_.HexFactory.instance.zero(32).value){
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
    else return new Result(hash,new Err.HashError("A produced hash has invalid form of hex"))
  }

  public for_mining(hex:_.IHex):Result<IHash,Err.HashError>{
    const hash_val:string = cryptonight(Buffer.from(hex.value,'hex'));
    const hash = new Hash(hash_val);
    const verified = hash.form_verify();
    if(verified.ok) return new Result(hash);
    else return new Result(hash,new Err.HashError("A produced hash for mining has invalid form of hex"))
  }

  public from_array(hexes:_.IHex[]):Result<IHash,Err.HashError>{
    const new_val:string = array2hash(hexes.map(hex=>hex.value));
    const hash = new Hash(new_val);
    const verified = hash.form_verify();
    if(verified.ok) return new Result(hash);
    else return new Result(hash,new Err.HashError("A produced hash from array has invalid form of hex"))
  }
}

export class PrivateKey extends _.Hex implements IPrivateKey {
  constructor(_value:string=_.HexFactory.instance.zero(32).value){
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
  constructor(_value:string=_.HexFactory.instance.zero(33).value){
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
}

export class Addrees extends _.Hex implements IAddress {
  constructor(_value:string=_.HexFactory.instance.zero(40).value){
    super(_value,40,false);
  }

  public slice_token_part():_.ITokenKey {
    const value = super.value.slice(0,16);
    const token_key = new _.TokenKey(value);
    return token_key;
  }

  public slice_hash_part():IHash {
    const value = super.value.slice(16,80);
    const hash = new Hash(value);
    return hash;
  }

  public verify_hashed_pub(pubs:IPublicKey[]):Result<boolean,Err.AddressError> {
    const val_from_other:string = ffi.get_sha256(ffi.get_sha256(reduce_pub(pubs.map(pub=>pub.value))));
    const val_from_mine = this.slice_hash_part().value;
    if(val_from_other===val_from_mine){
      return new Result(true);
    }
    else{
      return new Result(false,new Err.AddressError("invalid hashed pub in the address"));
    }
  }

  public verify(token:_.ITokenKey,pubKeys:IPublicKey[]):Result<boolean,Err.AddressError> {
    const fact:AddressFactory = AddressFactory.instance;
    const valid_hash = fact.from_pubKeys(token,pubKeys);
    if(valid_hash.err) return new Result(false,valid_hash.err);
    else if(!super.eq(valid_hash.ok)) return new Result(false,new Err.AddressError("address doesn't match"));
    else return new Result(true);
  }
}

export class AddressFactory implements IAddressFactory {
  private static _instance:AddressFactory;
  private constructor(){}
  public static get instance():AddressFactory{
    if (!this._instance) {
      this._instance = new AddressFactory();
    }
    return this._instance;
  }

  public from_pubKeys(token:_.ITokenKey,pubKeys:IPublicKey[]):Result<IAddress,Err.AddressError>{
    const reduced_pub_val = reduce_pub(pubKeys.map(pub=>pub.value));
    const hashed_pub:string = ffi.get_sha256(ffi.get_sha256(reduced_pub_val));
    const value:string = token.value+hashed_pub;
    const address = new Addrees(value);
    const verified = address.form_verify();
    if(verified.ok) return new Result(address);
    else return new Result(address,new Err.AddressError("fail to create new address because of invalid form"));
  }
}

export class SignData extends _.Hex implements ISignData {
  constructor(_value:string=_.HexFactory.instance.zero(64).value){
    super(_value,64,false);
  }
}

export class SignV extends _.Hex implements ISignV {
  constructor(_value:string=_.HexFactory.instance.zero(6).value){
    super(_value,6,false);
  }
}

export class Sign implements ISign {
  readonly data:ISignData;
  readonly v:ISignV;
  constructor(_data:ISignData=new SignData(),_v:ISignV=new SignV()){
    this.data = _data;
    this.v = _v;
  }

  verify(data:IHash,pubKey:IPublicKey):Result<boolean,Err.SignError> {
    const verified:boolean = ffi.verify_sign(data.value,this.data.value,pubKey.value);
    if(verified) return new Result(true);
    else return new Result(false,new Err.SignError("invalid sign"));
  }

  recover(data:IHash):Result<IPublicKey,Err.SignError> {
    const recovered:string = ffi.recover_public_key(data.value,this.data.value,this.v.value);
    const pubKey = new PublicKey(recovered);
    const verified = pubKey.form_verify();
    if(verified.ok) return new Result(pubKey);
    else return new Result(pubKey,new Err.SignError("fail to recover pubKey"));
  }
}

