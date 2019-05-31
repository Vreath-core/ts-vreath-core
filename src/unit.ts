import * as _ from './util'
import * as crypto_set from './crypto_set'
import {Result} from './result'
import * as Err from './error'

export interface Unit {
    value:[_.ICounter,_.IUint,_.ICounter,crypto_set.IAddress,_.IAmount]
    get_info_from_unit():Result<Promise<[crypto_set.IHash,crypto_set.IAddress,crypto_set.IHash]>,Err.UnitError>
}
  /*
    height:8 byte,
    index:1 byte,
    nonce,8 byte,
    address:40 byte,
    unit_price:10 byte
  */
