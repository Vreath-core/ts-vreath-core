import * as tx_set from './tx'
import * as T from './types'
import * as _ from './util'
import { DB } from './db';
import { Trie } from './merkle_patricia';


const check_tx = (tx:T.Tx,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
  if(tx.meta.kind===0){
    return tx_set.verify_req_tx(tx,trie,state_db,lock_db,[5]);
  }
  else if(tx.meta.kind===1){
    return tx_set.verify_ref_tx(tx,output_states,block_db,trie,state_db,lock_db,last_height,[]);
  }
  else return false;
}

export const tx2pool = async (pool_db:DB,tx:T.Tx,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
  if(check_tx(tx,output_states,block_db,trie,state_db,lock_db,last_height)){
    await pool_db.write_obj(tx.hash,tx);
  }
}
