import * as _ from './util'
import * as T from './types'
import * as crypto_set from './crypto_set'

export const CreateState = (nonce:string="0",token:string="0",owner:string=crypto_set.generate_address("",""),amount:string="0",data:string[]=[]):T.State=>{
  return {
    nonce:nonce,
    token:token,
    owner:owner,
    amount:amount,
    data:data
  }
}

export const CreateToken = (nonce:string="0",name:string="0",issued:string="0",code:string=crypto_set.get_sha256("")):T.Token=>{
  return {
    nonce:nonce,
    name:name,
    issued:issued,
    code:code
  }
}