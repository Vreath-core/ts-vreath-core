import * as Err from './error'

export interface Result<T,E> {
  readonly ok:T,
  readonly err?:E
}

export interface Comparison<T> {
  eq(another:T):boolean;
  larger(another:T):boolean;
  largerOrEq(another:T):boolean;
  smaller(another:T):boolean;
  smallerOrEq(another:T):boolean;
}

export interface Arithmetic<T,E> {
  add(one:T,two:T):Result<T,E>;
  sub(one:T,two:T):Result<T,E>;
  mul(one:T,two:T):Result<T,E>;
  div(one:T,two:T):Result<T,E>;
  mod(one:T,two:T):Result<T,E>;
}

export interface Computation<T,E> extends Comparison<T>,Arithmetic<T,E> {}

export interface Hex extends Comparison<Hex> {
  readonly value:string;
  readonly size:number;
  readonly variable_length:boolean;
  form_verify():Result<boolean,Err.HexError>;
  print():void;
  to_num():number;
  to_str():string;
}

export interface HexArithmetic extends Arithmetic<Hex,Err.HexError>{}

export interface Counter extends Hex {
  readonly size:8;
  readonly valriable_length:false;
}

export interface PrivateKey extends Hex {
  //readonly size:32;
  //readonly valriable_length:false;
  generate():void;
}

export interface PublicKey extends Hex {
  //readonly size:33;
  //readonly valriable_length:false;
  from_privKey(privKey:PrivateKey):void;
  reduce_pub(others:PublicKey[]):PublicKey;
}

export interface SignData extends Hex {
  //readonly size:64;
  //readonly valriable_length:false;
}

export interface SignV extends Hex {
  //readonly size:6;
  //readonly valriable_length:false;
}

export interface Sign {
  //readonly data:SignData//64 byte
  //readonly v:SignV;//6 byte
  sign(data:Hash,privKey:PrivateKey):void;
  verify(data:Hash,pubKey:PublicKey):Result<boolean,Err.SignError>;
  recover(data:Hash):Result<PublicKey,Err.SignError>
}

export interface TokenKey extends Hex {
  readonly size:8;
  readonly valriable_length:false;
}

export interface Address extends Hex {
  readonly size:40;
  readonly valriable_length:false;
  from_pubKey(pubKey:PublicKey):void;
  slice_token_part():TokenKey;
  slice_hash_part():Hash;
  hashed_pub_check(pub:string):Result<boolean,Err.AddressError>;
  form_check():Result<boolean,Err.AddressError>;
  check(pub:PublicKey,token:TokenKey):Result<boolean,Err.AddressError>;
}

export interface Amount extends Hex {
  readonly size:10;
  readonly valriable_length:false;
}

export interface Hash extends Hex {
  readonly size:32;
  readonly valriable_length:false;
  verify(original:Hex):Result<boolean,Err.AddressError>;
  verify_for_mining(original:Hex):Result<boolean,Err.AddressError>;
}

export interface FreeHex extends Hex {
  readonly valriable_length:true;
}

export interface Timestamp extends Computeable<Timestamp,Err.TimestampError> {
  readonly value:number;
}

export type Bit = 0|1;

export type encode = "utf8" | "hex" | "ascii" | "base64";

export interface db_able {
    get(key:Buffer):Promise<Result<Buffer,Err.DBError>>;
    put(key:Buffer,val:Buffer):Promise<Result<void,Err.DBError>>;
    del(key:Buffer):Promise<Result<void,Err.DBError>>;
    createReadStream():Result<void,Err.DBError>
}

export interface DB {
  readonly db:db_able;

  get(key:string,key_encode:encode,val_encode:encode):Promise<string|null>

  put(key:string,val:string,key_encode:encode,val_encode:encode):Promise<void>

  del(key:string,key_encode:encode):Promise<void>

  read_obj<T>(key:string):Promise<T|null>

  write_obj<T>(key:string,obj:T):Promise<void>

  filter<T>(key_encode:encode,val_encode:encode,check:(key:string,value:T)=>Promise<boolean>|boolean):Promise<T[]>

}

export interface Trie {
  readonly trie:DB;

  get<T>(key:Hex):Promise<Result<T|null,Err.TrieError>>

  put<T>(key:Hex,value:T):Promise<Result<void,Err.TrieError>>

  delete(key:Hex):Promise<Result<void,Err.TrieError>>

  now_root():Result<Hash,Err.TrieError>

  checkpoint():Result<void,Err.TrieError>

  filter<T>(check:(value:T)=>Promise<boolean>|boolean):Promise<Result<T[],Err.TrieError>>

  checkRoot(root:Hash):Promise<Result<boolean,Err.TrieError>>

}


export interface State {
  nonce:Counter;//8 byte hex
  token:TokenKey;//8 byte hex
  owner:Address;//40 byte hex
  amount: Amount;//10 byte hex
  data:FreeHex[];//free

  default():State
  create(nonce:Counter,token:TokenKey,owner:Address,amount:Amount,data:FreeHex[]):State;
  verify():Result<boolean,Err.StateError>;
}

export interface Token {
  nonce:Counter;//8 byte hex
  name:TokenKey;//8 byte hex
  issued:Amount;//10 byte hex
  code:Hash;//32 byte hex

  default():State
  create(nonce:Counter,name:TokenKey,issued:Amount,code:Hash):Token;
}

export interface Lock {
  address:Address;//40 byte
  state:Bit;//1 bit
  height:Counter;//8 byte
  block_hash:Hash;//32 byte
  index:number;//1 byte
  tx_hash:Hash;//32 byte

  default():State
}


export type TxKind = Bit;
export type TxType = 0;

export interface Request {
  type:TxType;//1 bit
  nonce:Counter;//8 byte hex
  feeprice:Amount;//10 byte
  gas:Amount;//10 byte
  bases:Address[];//40 byte * n
  input:FreeHex[];//free
  log:FreeHex;//free
}

export interface Refresh {
  height:Counter;//8 byte
  index:number;//1 byte
  success:Bit;//1 bit
  output:Hash[];//32 byte * n
  witness:FreeHex[];//free
  nonce:Counter;//8 byte
  gas_share:number;//1 byte
  unit_price:Amount//10 byte
}

export interface TxMeta {
  kind:TxKind;//1 bit
  request:Request;
  refresh:Refresh;
  to_hash():Hash;
}

export interface TxAdd {
  height:Counter;//8 byte
  hash:Hash;//32 byte
  index:number;//1 byte
}


export interface Tx {
  hash:string;//32 byte
  signature:Sign[];//70 byte * n
  meta:TxMeta;
  additional:TxAdd;
  default():Tx;
  req_verify(trie:Trie,state_db:DB,lock_db:DB,disabling:number[]):Promise<Result<boolean,Err.TxError>>;
  ref_verify(output_states:State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:Counter,disabling:number[]):Promise<Result<boolean,Err.TxError>>;
  sign(private_key:PrivateKey):Tx;
  req_accept(height:Counter,block_hash:Hash,index:number,trie:Trie,state_db:DB,lock_db:DB):Promise<Result<void,Err.TxError>>
  ref_accept(output_states:State[],height:Counter,block_hash:Hash,index:number,trie:Trie,state_db:DB,lock_db:DB,block_db:DB):Promise<Result<void,Err.TxError>>
}

export type BlockKind = Bit;//1 bit

export interface BlockMeta {
  kind:BlockKind;
  height:Counter;//8 byte
  previoushash:Hash;//32 byte
  timestamp: Timestamp;//0 ~ 9999999999
  pos_diff:Counter;//8 byte
  trie_root: Hash;//32 byte
  tx_root: Hash;//32 byte
  fee_sum:Amount;//10 byte
  extra:FreeHex;//free
  to_hash():Hash;
}

export interface BlockPure {
  hash:Hash;//32 byte
  signature: Sign;//70 byte
  meta:BlockMeta;
}

export interface Block {
  hash:Hash;//32 byte
  signature: Sign;//70 byte
  meta:BlockMeta;
  txs:Tx[];
  default:Block;
  key_verify(block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:Counter):Promise<Result<boolean,Err.BlockError>>;
  micro_verify(output_states:State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:Counter):Promise<Result<boolean,Err.BlockError>>;
  key_create(private_key:PrivateKey,block_db:DB,last_height:Counter,trie:Trie,state_db:DB,extra:FreeHex):Promise<Result<Block,Err.BlockError>>;
  micor_create(private_key:PrivateKey,block_db:DB,last_height:Counter,trie:Trie,txs:Tx[],extra:FreeHex):Promise<Result<Block,Err.BlockError>>;
  key_accept(block_db:DB,last_height:Counter,trie:Trie,state_db:DB,lock_db:DB):Promise<Result<void,Err.BlockError>>;
  micro_accept(output_states:State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB):Promise<Result<void,Err.BlockError>>;
}


export interface Unit {
  value:[Counter,number,Counter,Address,Amount]
}
/*
  height:8 byte,
  index:1 byte,
  nonce,8 byte,
  address:40 byte,
  unit_price:10 byte
*/