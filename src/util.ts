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

export const hash_size_check = (hash:string)=>{
  return Buffer.from(hash).length!=Buffer.from(crypto_set.get_sha256('')).length;
}

export const sign_check = (hash:string,signature:string,public_key:string)=>{
  return crypto_set.verify(hash,signature,public_key)==false
}

export const hashed_pub_check = (address:string,pubs:string[])=>{
    return address.slice(16,80)!=crypto_set.get_sha256(reduce_pub(pubs));
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

export const slice_token_part = (address:string)=>{
  return address.slice(0,16);
}

export const slice_hash_part = (address:string)=>{
  return address.slice(16,80);
}

export const slice_tokens = (addresses:string[])=>{
  return addresses.reduce((res:string[],add)=>{
    const sliced = slice_token_part(add);
    if(res.indexOf(sliced)===-1) return res.concat(sliced);
    else return res;
  },[]);
}
