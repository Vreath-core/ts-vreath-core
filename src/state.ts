import * as _ from './basic'
import * as T from './types'
import * as CryptoSet from './crypto_set'

export const CreateState = (nonce:number=0,owner:string=CryptoSet.GenereateAddress("",_.toHash("")),token:string="",amount:number=0,data:{[key:string]:string}={}):T.State=>{
  return {
    kind:"state",
    nonce:nonce,
    token:token,
    owner:owner,
    amount:amount,
    data:data,
    issued:0,
    code:_.toHash('')
  }
}

export const CreateInfo = (nonce=0,token="",issued=0,code=_.toHash('')):T.State=>{
  return {
    kind:"info",
    nonce:nonce,
    token:token,
    owner:'',
    amount:0,
    data:{},
    issued:issued,
    code:code
  }
}