import * as _ from '../util'
import * as T from '../types'
import * as tx_set from '../tx'
import * as crypto_set from '../crypto_set'
import {constant} from '../constant'
import {CreateState} from '../state'
import bigInt, { BigInteger } from 'big-integer'
import * as P from 'p-iteration'
import { DB } from '../db';
import { Trie } from '../merkle_patricia';
import {read_from_trie} from '../data'
import { data } from '../..';

const ethereum = constant.ethereum;
export const finality_height = 10;
export const ethereum_info_address = crypto_set.generate_address(constant.ethereum,"00");

export type ethereum_header = {
  difficulty: string,
  extraData: string,
  hash: string,
  logsBloom: string,
  miner: string,
  number: string,
  parentHash: string,
  receiptsRoot: string,
  signature: string,
  size: string,
  stateRoot: string,
  timestamp: string,
  totalDifficulty: string,
  transactionsRoot: string,
}

export const ethereum_prove = async (base_state:T.State[],input_data:string[],trie:Trie,state_db:DB,validators:string[],signatures:T.Sign[]):Promise<T.State[]>=>{
    const type = input_data[0];
    switch(type){
      case "00":
        const transfered = await transfer(input_data.slice(1,15),trie,state_db,validators,signatures);
        if(transfered==null) return base_state;
        return transfered.filter(s=>s!=null) as T.State[];
    default: return base_state;
    }
}

export const ethereum_verify = async (base_state:T.State[],input_data:string[],output_state:T.State[],trie:Trie,state_db:DB,validators:string[],signatures:T.Sign[])=>{
  const type = input_data[0];
  switch(type){
      case "00":
          const valid_output = await ethereum_prove(base_state,input_data,trie,state_db,validators,signatures);
          const check = output_state.some((o,i)=>{
            const valid = valid_output[i];
            if(valid==null) return true;
            const hash1 = _.array2hash([o.nonce,o.token,o.owner,o.amount].concat(o.data));
            const hash2 = _.array2hash([valid.nonce,valid.token,valid.owner,valid.amount].concat(valid.data));
            return hash1 != hash2;
          });
          return !check;
      default: return false;
  }
}


const transfer = async (input_data:string[],trie:Trie,state_db:DB,validators:string[],signatures:T.Sign[]):Promise<[T.State,T.State,T.State|null]|null>=>{
  const header:ethereum_header = {
    difficulty:input_data[0],
    extraData:input_data[1],
    hash:input_data[2],
    logsBloom:input_data[3],
    miner:input_data[4],
    number:input_data[5],
    parentHash:input_data[6],
    receiptsRoot:input_data[7],
    signature:input_data[8],
    size:input_data[9],
    stateRoot:input_data[10],
    timestamp:input_data[11],
    totalDifficulty:input_data[12],
    transactionsRoot:input_data[13]
  }
  // data := [kind(memory="00"),last height,last block hash,finalized last height,finalized last block hash]
  let meta_state = await read_from_trie(trie,state_db,ethereum_info_address,0,CreateState("00",constant.ethereum,ethereum_info_address,"00",["00","00",crypto_set.get_sha256(""),"00",crypto_set.get_sha256("")]));
  if(bigInt(header.number,16).lesserOrEquals(bigInt(meta_state.data[3],16))) return null;
  const object_id = block_id(header.number,header.hash);
  // data := [kind(memory="01"),finalized(true="00"),difficulty,extraData,hash,logsBloom,miner,number,parentHash,receiptsRoot,signature,size,stateRoot,timestamp,totalDifficulty,transactionsRoot]
  const already_obj = await read_from_trie(trie,state_db,object_id,0,CreateState());
  if(already_obj.data.length===0) return null
  const memory_obj = CreateState("00",constant.ethereum,object_id,"00",input_data);
  const recover_ids = signatures.map(s=>tx_set.get_recover_id_from_sign(s));
  const pub_keys = signatures.map((s,i)=>crypto_set.recover(object_id,s.data,recover_ids[i]));
  const addresses = pub_keys.map(p=>crypto_set.generate_address(ethereum,p));
  if(addresses.some(add=>validators.indexOf(add)===-1)) return null;
  else if(signatures.some((s,i)=>!crypto_set.verify(object_id,s.data,pub_keys[i]))) return null;
  meta_state.data[1] = header.number;
  meta_state.data[2] = header.hash;
  let height:string;
  let id:string;
  let state:T.State = memory_obj;
  let i:number = 1;
  let finalized_state:T.State|null = null;
  for(i;!bigInt(header.number,16).lesser(i);i++){
    height = _.bigInt2hex(bigInt(header.number,16).subtract(i));
    id = block_id(height,state.data[8]);
    state = await read_from_trie(trie,state_db,id,0,CreateState());
    if(state.data.length===0||state.data[1]==="01") break;
    else if(state.data[1]==="00"&&i>=finality_height){
      meta_state.data[3] = height;
      meta_state.data[4] = state.data[4];
      finalized_state = state;
      break;
    }
  }
  return [meta_state,memory_obj,finalized_state];
}

export const block_id = (height:string,hash:string)=>crypto_set.generate_address(ethereum,"00"+_.array2hash([height,hash]));
