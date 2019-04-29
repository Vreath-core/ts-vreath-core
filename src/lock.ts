import * as T from './types'
import * as crypto_set from './crypto_set'

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