import * as _ from './util'
import * as T from './types'
import * as crypto_set from './crypto_set'

export const CreateState = (nonce:string="00",token:string="00",owner:string=crypto_set.generate_address("",""),amount:string="00",data:string[]=[]):T.State=>{
  return {
    nonce:nonce,
    token:token,
    owner:owner,
    amount:amount,
    data:data
  }
}

export const CreateToken = (nonce:string="00",name:string="00",issued:string="00",code:string=crypto_set.get_sha256("")):T.Token=>{
  return {
    nonce:nonce,
    name:name,
    issued:issued,
    code:code
  }
}