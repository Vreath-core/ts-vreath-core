import { type } from "os";

export type State = {
  nonce:string;//10 byte hex
  token:string;//12 byte hex
  owner:string;//42 byte hex
  amount:string;//12 byte hex
  data:string[];//free
}

export type Token = {
  nonce:string;//10 byte hex
  name:string;//12 byte hex
  issued:string;//12 byte hex
  code:string;//32 byte hex
}

export type Lock = {
  address:string;//42 byte
  state:0 | 1;//1 bit
  height:string;//10 byte
  block_hash:string;//32 byte
  index:number;//1 byte
  tx_hash:string;//32 byte
}


export type TxKind = 0 | 1;
export type TxType = 0;

export type Request = {
  type:TxType;//1 bit
  feeprice:string;//12 byte
  gas:string;//12 byte
  bases:string[];//42 byte * n
  input:string[];//free
  log:string;//free
}

export type Refresh = {
  height:string;//10 byte
  index:number;//1 byte
  success:0|1;//1 bit
  output:string[];//32 byte * n
  witness:string[];//free
  nonce:string;//10 byte
  gas_share:number;//1 byte
  unit_price:string//12 byte
}

export type TxMeta = {
  kind:TxKind;//1 bit
  request:Request;
  refresh:Refresh;
}

export type TxAdd = {
  height:number;//10 byte
  hash:string;//32 byte
  index:number;//1 byte
}

export type Sign = {
  data:string//64 byte
  v:number;//1 byte
}

export type Tx = {
  hash:string;//32 byte
  signature:Sign[];//65 byte
  meta:TxMeta;
  additional:TxAdd;
}

export type BlockKind = 0 | 1;//1 bit

export type BlockMeta = {
  kind:BlockKind;
  height:string;//10 byte
  previoushash:string;//32 byte
  timestamp: number;//5 byte
  pos_diff:string;//10 byte
  stateroot: string;//32 byte
  lockroot: string;//32 byte
  tx_root: string;//32 byte
  fee_sum:string;//12 byte
  extra:string;//free
}

export type BlockPure = {
  hash:string;//32 byte
  validatorSign: Sign;//65 byte
  meta:BlockMeta;
}

export type Block = {
  hash:string;//32 byte
  validatorSign: string;//65 byte
  meta:BlockMeta;
  txs:Tx[];
}

export type Pool = {
  [key:string]:Tx;
}

export type Unit = [string,number,string,string,string];
/*
  height:10 byte,
  index:1 byte,
  nonce,10 byte,
  address:42 byte,
  unit_price:12 byte
*/
