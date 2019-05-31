"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ffi = require('../ffi-vreath/lib/index');
const cryptonight = require('node-cryptonight-lite').hash;
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
