import * as T from './types'
import * as _ from './util'
import * as crypto_set from './crypto_set'
import {Result} from './result'
import * as Err from './error'
/*
export const CreateLock = (address:string=crypto_set.generate_address("",""),state:0|1=0,height:string="00",block_hash:string=crypto_set.get_sha256(""),index:number=0,tx_hash:string=crypto_set.get_sha256("")):T.Lock=>{
      return {
          address:address,
          state:state,
          height:height,
          block_hash:block_hash,
          index:index,
          tx_hash:tx_hash
      }
  }
*/
export interface ILock {
    address:crypto_set.IAddress;//40 byte
    state:_.Bit;//1 bit
    height:_.ICounter;//8 byte
    block_hash:crypto_set.IHash;//32 byte
    index:_.IUint;//1 byte
    tx_hash:crypto_set.IHash;//32 byte

    verify():Result<boolean,Err.StateError>;
}

export interface ILockFactory {
    default():ILock;
    create(address?:crypto_set.IAddress,state?:_.Bit,height?:_.ICounter,index?:_.IUint,tx_hash?:crypto_set.IHash):ILock;
}