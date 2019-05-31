import * as _ from './util'
import {Result} from './result'
import * as Err from './error'
import * as crypto_set from './crypto_set'

/*export const CreateState = (nonce:string="00",token:string="00",owner:string=crypto_set.generate_address("",""),amount:string="00",data:string[]=[]):T.State=>{
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
*/

export interface IState {
  nonce:_.ICounter;//8 byte hex
  token:_.ITokenKey;//8 byte hex
  owner:crypto_set.IAddress;//40 byte hex
  amount: _.IAmount;//10 byte hex
  data:_.IFreeHex[];//free

  verify():Result<boolean,Err.StateError>;
}

export interface IStateFactory {
  default():IState
  create(nonce?:_.ICounter,token?:_.ITokenKey,owner?:crypto_set.IAddress,amount?:_.IAmount,data?:_.IFreeHex[]):IState;
}

export interface IToken {
  nonce:_.ICounter;//8 byte hex
  name:_.ITokenKey;//8 byte hex
  issued:_.IAmount;//10 byte hex
  code:crypto_set.IHash;//32 byte hex

  verify():Result<boolean,Err.StateError>;
}

export interface ITokenFactory {
  default():IToken
  create(nonce?:_.ICounter,name?:_.ITokenKey,issued?:_.IAmount,code?:crypto_set.IHash):IToken;
}