import * as TxSet from './tx'
import * as T from './types'
import * as _ from './basic'


const check_tx = (tx:T.Tx,chain:T.Block[],StateData:T.State[],LockData:T.Lock[])=>{
  if(tx.meta.kind=="request"){
    return TxSet.ValidRequestTx(tx,false,StateData,LockData);
  }
  else if(tx.meta.kind=="refresh"){
    return TxSet.ValidRefreshTx(tx,chain,true,StateData,LockData);
  }
  else return false;
}

export const Tx_to_Pool = (pool:T.Pool,tx:T.Tx,chain:T.Block[],StateData:T.State[],LockData:T.Lock[])=>{
  if(!check_tx(tx,chain,StateData,LockData)) return pool;
  const new_pool = _.new_obj(
    pool,
    p=>{
      p[tx.hash] = tx;
      return p;
    }
  )
  return new_pool;
}
