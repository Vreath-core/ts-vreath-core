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
    readonly address:crypto_set.IAddress;//40 byte
    readonly state:_.Bit;//1 bit
    readonly height:_.ICounter;//8 byte
    readonly block_hash:crypto_set.IHash;//32 byte
    readonly index:_.IUint;//1 byte
    readonly tx_hash:crypto_set.IHash;//32 byte
}

export class Lock implements ILock {
    readonly address:crypto_set.IAddress;//40 byte
    readonly state:_.Bit;//1 bit
    readonly height:_.ICounter;//8 byte
    readonly block_hash:crypto_set.IHash;//32 byte
    readonly index:_.IUint;//1 byte
    readonly tx_hash:crypto_set.IHash;//32 byte

    constructor(_address=new crypto_set.Addrees(), _state:_.Bit=0,_height=new _.Counter(),_block_hash=new crypto_set.Hash(),_index=new _.Uint(),_tx_hash=new crypto_set.Hash()){
      this.address = _address;
      this.state = _state;
      this.height = _height;
      this.block_hash = _block_hash;
      this.index = _index;
      this.tx_hash = _tx_hash;
    }
}
