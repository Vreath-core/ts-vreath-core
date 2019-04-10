import * as wasm from 'wasm-vreath'
import * as crypto from 'crypto'
const cryptonight = require('node-cryptonight-lite').hash;

export const hex2u8_array = (hex:string):Uint8Array=>{
  return Uint8Array.from(Buffer.from(hex,'hex'));
}

export const u8_array2hex = (u8_array:Uint8Array):string=>{
  return Buffer.from(u8_array).toString('hex');
}

export const get_sha256 = (hex:string):string=>{
  let input = hex2u8_array(hex);
  return wasm.wasm_get_sha256(input);
}

export const generate_key = ():string=>{
  let randoms:number[] = [];
  let i:number;
  for(i=0;i<32;i++){
    randoms[i] = Math.floor(Math.random()*256);
  }
  return wasm.wasm_generate_key(Uint8Array.from(randoms));
}

export const private2public = (private_key:string):string=>{
  const private_array = hex2u8_array(private_key);
  return wasm.wasm_private2public(private_array);
}

export const get_shared_secret = (private_key:string,public_key:string)=>{
  const private_array = hex2u8_array(private_key);
  const public_array = hex2u8_array(public_key);
  return wasm.wasm_get_shared_secret(private_array,public_array);
}

export const encrypt = (data:string,secret:string):string=>{
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
}


export const sign = (data:string,private_key:string):[number,string]=>{
  const data_array = hex2u8_array(data);
  const private_array = hex2u8_array(private_key);
  const signed = wasm.wasm_recoverable_sign(private_array,data_array);
  const splited = signed.split('_');
  const recover_id = Number(splited[0]);
  const sign = splited[1];
  return[recover_id,sign];
}

export const recover = (data:string,sign:string,recover_id:number):string=>{
  const data_array = hex2u8_array(data);
  const sign_array = hex2u8_array(sign);
  return wasm.wasm_recover_public_key(data_array,sign_array,recover_id);
}


export const verify = (data:string,sign:string,public_key:string):boolean=>{
  const data_array = hex2u8_array(data);
  const sign_array = hex2u8_array(sign);
  const public_array = hex2u8_array(public_key);
  const verify = wasm.wasm_verify_sign(data_array,sign_array,public_array);
  return verify
}

export const generate_address = (token:string,public_key:string)=>{
    const token_part = ("0000000000"+token).slice(-12);
    const hash = get_sha256(get_sha256(public_key));
    const key_part = ("00000000000000000000"+hash).slice(-20);
    return token_part+key_part;
}

export const compute_cryptonight = (data:string):string=>{
  const hash = cryptonight(Buffer.from(data,'hex'));
  return hash.toString('hex');
}

