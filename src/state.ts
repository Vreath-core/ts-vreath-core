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
  readonly nonce:_.ICounter;//8 byte hex
  readonly token:_.ITokenKey;//8 byte hex
  readonly owner:crypto_set.IAddress;//40 byte hex
  readonly amount: _.IAmount;//10 byte hex
  readonly data:_.IFreeHex[];//free

  verify():Result<boolean,Err.StateError>;
}

export interface IToken {
  readonly nonce:_.ICounter;//8 byte hex
  readonly name:_.ITokenKey;//8 byte hex
  readonly issued:_.IAmount;//10 byte hex
  readonly code:crypto_set.IHash;//32 byte hex
}


export class State implements IState {
  readonly nonce:_.ICounter;//8 byte hex
  readonly token:_.ITokenKey;//8 byte hex
  readonly owner:crypto_set.IAddress;//40 byte hex
  readonly amount: _.IAmount;//10 byte hex
  readonly data:_.IFreeHex[];//free

  constructor(_nonce=new _.Counter(), _token=new _.TokenKey(),_owner=new crypto_set.Addrees(),_amount=new _.Amount(),_data=[]){
    this.nonce = _nonce;
    this.token = _token;
    this.owner = _owner;
    this.amount = _amount;
    this.data = _data;
  }

  verify():Result<boolean,Err.StateError> {
    if(this.owner.slice_token_part().eq(this.token)) return new Result(true);
    else return new Result(false,new Err.StateError("invalid state"));
  }
}

export class Token implements IToken {
  readonly nonce:_.ICounter;//8 byte hex
  readonly name:_.ITokenKey;//8 byte hex
  readonly issued: _.IAmount;//10 byte hex
  readonly code:crypto_set.IHash;//32 byte hex

  constructor(_nonce=new _.Counter(), _name=new _.TokenKey(),_issued=new _.Amount(),_code=new crypto_set.Hash()){
    this.nonce = _nonce;
    this.name = _name;
    this.issued = _issued;
    this.code = _code;
  }
}

