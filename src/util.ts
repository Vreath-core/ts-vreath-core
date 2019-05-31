import * as T from './types'
import * as Err from './error'
import {Result} from './result'
import * as crypto_set from './crypto_set'
import {cloneDeep} from 'lodash'
import bigInt, { BigInteger } from 'big-integer'

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

const bigInt2hex = (bigint:BigInteger):string=>{
  let hex = bigint.toString(16);
  if(hex.length%2!=0) hex = "0"+hex;
  return hex;
}

export interface IComparison<T> {
  eq(another:T):boolean;
  larger(another:T):boolean;
  largerOrEq(another:T):boolean;
  smaller(another:T):boolean;
  smallerOrEq(another:T):boolean;
}

export interface IArithmetic<T,E> {
  readonly value:T;
  add(another:T|Result<T,E>):Result<T,E>;
  sub(another:T|Result<T,E>):Result<T,E>;
  mul(another:T|Result<T,E>):Result<T,E>;
  div(another:T|Result<T,E>):Result<T,E>;
  mod(another:T|Result<T,E>):Result<T,E>;
}

export interface IComputation<T,E> extends IComparison<T>,IArithmetic<T,E> {}


export interface IHex extends IComparison<IHex> {
  readonly value:string;
  readonly size:number;
  readonly variable_length:boolean;
  form_verify():Result<boolean,Err.HexError>;
  print():void;
  to_num():number;
  to_str():string;
}

export interface IHexFactory {
  from_number(num:number,valriable_length:boolean):Result<IHex,Err.HexError>;
  from_bigInt(bigint:BigInteger,valriable_length:boolean):Result<IHex,Err.HexError>;
}


export interface IHexArithmetic extends IArithmetic<IHex,Err.HexError> {}

export interface ICounter extends IHex {
  /*readonly size:8;
  readonly valriable_length:false;*/
}

export interface ITokenKey extends IHex {
  /*readonly size:8;
  readonly valriable_length:false;*/
}

export interface IAmount extends IHex {
  /*readonly size:10;
  readonly valriable_length:false;*/
}

export interface IFreeHex extends IHex {
  //readonly valriable_length:true;
}

export type Bit = 0|1;

export interface IUint extends IComparison<IUint> {
  readonly value:number;
  form_verify():Result<boolean,Err.UintError>
}

export interface IUintArithmetic extends IArithmetic<IUint,Err.UintError> {}

export interface ITimestamp extends IUint {
  form_verify():Result<boolean,Err.TimestampError>
}


export class Hex implements IHex {
  readonly value:string;
  readonly size:number;
  readonly variable_length:boolean;

  constructor(_value:string,_size:number,_variable_length:boolean){
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

  public eq(another:IHex):boolean{
    return bigInt(this.value,16).eq(bigInt(another.value,16));
  }

  public larger(another:IHex){
    return !bigInt(this.value,16).lesserOrEquals(bigInt(another.value,16));
  }

  public largerOrEq(another:IHex){
    return !bigInt(this.value,16).lesser(bigInt(another.value,16));
  }

  public smaller(another:IHex){
    return bigInt(this.value,16).lesser(bigInt(another.value,16));
  }

  public smallerOrEq(another:IHex){
    return bigInt(this.value,16).lesserOrEquals(bigInt(another.value,16));
  }
}

export class HexFactory implements IHexFactory {
  private static _instance:HexFactory;
  private constructor(){}

  public static get instance():HexFactory{
    if (!this._instance) {
      this._instance = new HexFactory();
    }
    return this._instance;
  }

  public from_number(num:number,valriable_length:boolean):Result<Hex,Err.HexError>{
    try{
      let value = num.toString(16);
      if(value.length%2!=0) value = "0"+value;
      return new Result(new Hex(value,Math.floor(value.length),valriable_length));
    }
    catch(e){
      return new Result(new Hex("",0,false),new Err.HexError(e));
    }
  }

  public from_bigInt(bigint:BigInteger,valriable_length:boolean):Result<Hex,Err.HexError>{
    try{
      const value = bigInt2hex(bigint);
      return new Result(new Hex(value,Math.floor(value.length/2),valriable_length));
    }
    catch(e){
      return new Result(new Hex("",0,false),new Err.HexError(e));
    }
  }
}

export class HexArithmetic implements IHexArithmetic {
  readonly value:Hex;
  constructor(_value:Hex){
    this.value = _value;
  }

  private get_size(str:string):number{
    const len = str.length;
    return Math.floor(len/2);
  }

  private abst(another:Hex|Result<Hex,Err.HexError>,fn_name:'add'|'subtract'|'multiply'|'divide'|'mod'):Result<IHex,Err.HexError>{
    if(another instanceof Result &&another.err!=null) return another;
    const ano_val = another instanceof Result ? another.ok : another;
    const fn = bigInt(this.value.to_str(),16)[fn_name]
    const new_value = fn(bigInt(ano_val.to_str(),16));
    const str = bigInt2hex(new_value);
    const size = this.get_size(str);
    const hex = new Hex(str,size,true);
    const verified = hex.form_verify();
    if(verified.ok===false&&verified.err!=null) return new Result(hex,verified.err);
    else return new Result(hex);
  }

  public add(another:Hex){
    return this.abst(another,'add');
  }

  public sub(another:IHex){
    return this.abst(another,'subtract');
  }

  public mul(another:IHex){
    return this.abst(another,'multiply');
  }

  public div(another:IHex){
    return this.abst(another,'divide');
  }

  public mod(another:IHex){
    return this.abst(another,'mod');
  }
}


export class Counter extends Hex implements ICounter {
  constructor(_value:string){
    super(_value,8,false)
  }
}

export class TokenKey extends Hex implements ITokenKey {
  constructor(_value:string){
    super(_value,8,false)
  }
}

export class Amount extends Hex implements IAmount {
  constructor(_value:string){
    super(_value,10,false)
  }
}

export class FreeHex extends Hex implements IFreeHex {
  constructor(_value:string,_size:number){
    super(_value,_size,true);
  }
}

export class Uint implements IUint {
  readonly value:number;

  constructor(_value:number){
    this.value = _value;
  }

  form_verify():Result<boolean,Err.UintError>{
    if(this.value==null || typeof this.value != 'number' || !Number.isInteger(this.value) || this.value<0) return new Result(false,new Err.UintError("invalid uint"));
    else return new Result(true);
  }

  eq(another:Uint):boolean{
    return this.value===another.value;
  }

  larger(another:Uint):boolean{
    return this.value > another.value;
  }

  largerOrEq(another:Uint):boolean{
    return this.value >= another.value;
  }

  smaller(another:Uint):boolean{
    return this.value < another.value;
  }

  smallerOrEq(another:Uint):boolean{
    return this.value <= another.value;
  }
}

export class Timestamp extends Uint implements ITimestamp {
  constructor(_value:number){
    super(_value);
  }

  form_verify():Result<boolean,Err.TimestampError>{
    if(super.form_verify().ok===false) return new Result(false,new Err.TimestampError("invalid timestamp because of the form as uint"));
    else if(super.value.toString(10).length!=10) return new Result(false,new Err.TimestampError("invalid timestamp because of the size"));
    else return new Result(true);
  }
}

