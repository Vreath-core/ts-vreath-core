import * as tx_set from './tx'
import * as T from './types'
import {Result} from './result'
import * as Err from './error'
import * as _ from './util'
import * as state_set from './state'
import { IDBRepository } from './db';
import { ITrie } from './merkle_patricia';


/*const check_tx = (tx:T.Tx,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
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
}*/

export interface PoolServices {
  tx2pool(pool_db:IDBRepository,tx:tx_set.ITx,output_states:state_set.IState[],block_db:IDBRepository,trie:ITrie,state_db:IDBRepository,lock_db:IDBRepository,last_height:_.ICounter):Result<Promise<void>,Err.PoolError>
}