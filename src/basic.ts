import * as CryptoSet from './crypto_set'
import {en_key} from './merkle_patricia'
import {cloneDeep} from 'lodash'


export const copy = <T>(data:T)=>{
  return cloneDeep(data);
}


export const new_obj = <T>(obj:T,fn:(obj:T)=>T)=>{
  return fn(copy(obj));
}

export const toHash = (str:string)=>{
  return CryptoSet.HashFromPass(str);
}

export const Object2string = <T>(obj:{[key:string]:T}|T[]|T):string=>{
  if(obj instanceof Array){
    return obj.reduce((res:string,val)=>res+Object2string(val),'');
  }
  else if(obj instanceof Object){
    return Object.entries(obj).slice().sort((a,b)=>Number(en_key(a[0])||"0")-Number(en_key(b[0]||"0"))).reduce((res:string,item)=>{
      const val:T = item[1];
      return res+Object2string(val);
    },'');
  }
  else if(['number','string','booleam'].indexOf(typeof obj)!=-1) return String(obj);
  else return '';
}

export const ObjectHash = <T>(obj:{[key:string]:T}|T[])=>{
  const str = Object2string(obj);
  return toHash(str);
}


export const Hex_to_Num = (str:string):number=>{
  return parseInt(str,16);
}

export const toHashNum = (str:string):number=>{
  return Hex_to_Num(toHash(str));
}

export const get_unicode = (str:string):number[]=>{
  return str.split("").map((val)=>{
    return val.charCodeAt(0);
  });
}

export const reduce_pub = (pubs:string[])=>{
  if(pubs.length===0) return toHash('');
  else if(pubs.length===1) return toHash(pubs[0]);
  return pubs.slice().sort().reduce((res:string,pub:string)=>{
    return toHash(pub+res);
  }) || toHash('');
}

export const get_string = (uni:number[]):string=>{
  return String.fromCharCode.apply({},uni);
}

export const object_hash_check = (hash:string,obj:{[key:string]:any}|any[])=>{
  return hash!=ObjectHash(obj);
}

export const hash_size_check = (hash:string)=>{
  return Buffer.from(hash).length!=Buffer.from(toHash('')).length;
}

export const sign_check = (hash:string,signature:string,pub_key:string)=>{
  return CryptoSet.verifyData(hash,signature,pub_key)==false
}

export const address_check = (address:string,Public:string,token:string)=>{
  return address!=CryptoSet.GenereateAddress(token,Public);
}

export const time_check = (timestamp:number)=>{
  const date = new Date();
  return timestamp>Math.floor(date.getTime()/1000);
}

export const address_form_check = (address:string,token_name_maxsize:number)=>{
  const splitted = address.split(":");
  return splitted.length!=3 || splitted[0]!="Vr" || Buffer.from(splitted[1]).length>token_name_maxsize;
}


