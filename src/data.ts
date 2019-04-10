import * as P from 'p-iteration'
import * as _ from './util'
import * as crypto_set from './crypto_set'
import * as T from './types'
import { Trie } from './merkle_patricia';
import {DB} from './db'

export const trie_ins = (db:DB,root:string)=>{
    try{
        return new Trie(db,root);
    }
    catch(e){
        console.log(e);
        return new Trie(db);
    }
}


export const read_from_trie = async <T>(trie:Trie,db:DB,key:string,index:0|1,empty:T)=>{
    const hashes:[string,string]= await trie.get(key);
    if(hashes==null) return empty;
    const raw:T = await db.read_obj(hashes[index]);
    if(raw==null) return empty;
    else return raw;
}

export const write_state_hash = async (db:DB,state:T.State)=>{
    const hash = crypto_set.get_sha256(_.hex_sum([state.nonce,state.token,state.token,state.amount].concat(state.data)));
    await db.write_obj(hash,state);
    return hash;
}

export const write_lock_hash = async (db:DB,lock:T.Lock)=>{
    const hash = crypto_set.get_sha256(_.hex_sum([lock.address,lock.index.toString(16),lock.height,lock.index.toString(16),lock.tx_hash]));
    await db.write_obj(hash,lock);
    return hash;
}

export const write2trie = async (trie:Trie,state_db:DB,lock_db:DB,state:T.State,lock:T.Lock)=>{
    const state_hash = await write_state_hash(state_db,state);
    const lock_hash = await write_lock_hash(lock_db,lock);
    await trie.put(state.owner,[state_hash,lock_hash]);
}