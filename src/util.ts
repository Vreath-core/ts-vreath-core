import * as T from './types'
import * as Err from './error'
import * as crypto_set from './crypto_set'
import {cloneDeep} from 'lodash'
import bigInt, { BigInteger } from 'big-integer'

export const copy = <T>(data:T)=>{
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
}

class Result<T,E> implements T.Result<T,E> {
  constructor(readonly ok:T,readonly err?:E){}
}


export class Hex implements T.Hex {
  readonly value:string;
  readonly size:number;
  readonly variable_length:boolean;

  constructor(readonly _value:string,readonly _size:number,readonly _variable_length:boolean){
    this.value = _value;
    this.size = _size;
    this.variable_length = _variable_length;
  }

  public form_verify():Result<boolean,Err.HexError>{
    if(this.value==null || typeof this.value != 'string' || Buffer.from(this.value,'hex').length*2!=this.value.length || this.value.length%2!=0) return new Result(false,new Err.HexError("invalid hex value"));
    if(this.size!=null&&((this.variable_length!=true&&this.value.length!=this.size*2)||(this.variable_length===true&&this.value.length>this.size*2))) return new Result(false,new Err.HexError("hex doesn't meet the constraint"));
    const array = this.value.split('');
    const exp = new RegExp('[a-f0-9]');
    const exp_test = array.some(str=>{
      return !exp.test(str);
    });
    if(exp_test) return new Result(false,new Err.HexError("hex doesn't meet regexp"));
    else return new Result(true);
  }

  public print(){
    console.log(this.value);
  }

  public to_num(){
    return parseInt(this.value,16);
  }

  public to_str(){
    //if(hex.length%2!=0) hex = "0"+hex;
    return this.value;
  }

  public eq(another:T.Hex):boolean{
    return bigInt(this.value,16).eq(bigInt(another.value,16));
  }

  public larger(another:T.Hex){
    return !bigInt(this.value,16).lesserOrEquals(bigInt(another.value,16));
  }

  public largerOrEq(another:T.Hex){
    return !bigInt(this.value,16).lesser(bigInt(another.value,16));
  }

  public smaller(another:T.Hex){
    return bigInt(this.value,16).lesser(bigInt(another.value,16));
  }

  public smallerOrEq(another:T.Hex){
    return bigInt(this.value,16).lesserOrEquals(bigInt(another.value,16));
  }
}

export class HexArithmetic implements T.HexArithmetic {
  private static _instance:HexArithmetic;
  private constructor(){}

  public static get instance():HexArithmetic{
    if (!this._instance) {
      this._instance = new HexArithmetic();
    }
    return this._instance;
  }

  private bigInt2hex(bigint:BigInteger):string{
    let hex = bigint.toString(16);
    if(hex.length%2!=0) hex = "0"+hex;
    return hex;
  }

  private get_size(str:string):number{
    const len = str.length;
    return Math.floor(len/2);
  }

  private abst(one:Hex,two:Hex,fn_name:'add'|'subtract'|'multiply'|'divide'|'mod'):Result<Hex,Err.HexError>{
    const fn = bigInt(one.to_str(),16)[fn_name]
    const new_value = fn(bigInt(two.to_str(),16));
    const str = this.bigInt2hex(new_value);
    const size = this.get_size(str);
    const hex = new Hex(str,size,true);
    const verified = hex.form_verify();
    if(verified.ok===false&&verified.err!=null) return new Result(hex,verified.err);
    else return new Result(hex);
  }

  public add(one:Hex,two:Hex){
    return this.abst(one,two,'add');
  }

  public sub(one:Hex,two:Hex){
    return this.abst(one,two,'subtract');
  }

  public mul(one:Hex,two:Hex){
    return this.abst(one,two,'multiply');
  }

  public div(one:Hex,two:Hex){
    return this.abst(one,two,'divide');
  }

  public mod(one:Hex,two:Hex){
    return this.abst(one,two,'mod');
  }
}
