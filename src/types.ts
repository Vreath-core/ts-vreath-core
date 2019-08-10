import contract from './contract'

export type State = {
  nonce:string;//8 byte hex
  token:string;//8 byte hex
  owner:string;//40 byte hex
  amount:string;//10 byte hex
  data:string[];//free
}

export type Token = {
  nonce:string;//8 byte hex
  name:string;//8 byte hex
  issued:string;//10 byte hex
  code:string;//32 byte hex
}

export type Lock = {
  address:string;//40 byte
  state:0 | 1;//1 bit
  height:string;//8 byte
  block_hash:string;//32 byte
  index:number;//1 byte
  tx_hash:string;//32 byte
}


export type TxKind = 0 | 1;
export type TxType = 0;

export type Request = {
  type:TxType;//1 bit
  nonce:string;//8 byte hex
  feeprice:string;//10 byte
  gas:string;//10 byte
  bases:string[];//40 byte * n
  input:string[];//free
  log:string;//free
}

export type Refresh = {
  height:string;//8 byte
  index:number;//1 byte
  success:0|1;//1 bit
  output:string[];//32 byte * n
  witness:string[];//free
  nonce:string;//8 byte
  gas_share:number;//1 byte
  unit_price:string//10 byte
}

export type TxMeta = {
  kind:TxKind;//1 bit
  request:Request;
  refresh:Refresh;
}

export type TxAdd = {
  height:string;//8 byte
  hash:string;//32 byte
  index:number;//1 byte
}

export type Sign = {
  data:string//64 byte
  v:string;//6 byte
}

export type Tx = {
  hash:string;//32 byte
  signature:Sign[];//70 byte * n
  meta:TxMeta;
  additional:TxAdd;
}

export type BlockKind = 0 | 1;//1 bit

export type BlockMeta = {
  kind:BlockKind;
  height:string;//8 byte
  previoushash:string;//32 byte
  timestamp: number;//0 ~ 9999999999
  pos_diff:string;//8 byte
  trie_root: string;//32 byte
  tx_root: string;//32 byte
  fee_sum:string;//10 byte
  extra:string;//free
}

export type BlockPure = {
  hash:string;//32 byte
  signature: Sign;//70 byte
  meta:BlockMeta;
}

export type Block = {
  hash:string;//32 byte
  signature: Sign;//70 byte
  meta:BlockMeta;
  txs:Tx[];
}


export type Unit = [string,number,string,string,string];
/*
  height:8 byte,
  index:1 byte,
  nonce,8 byte,
  address:40 byte,
  unit_price:10 byte
*/

export type Finalize = {
  height:string,
  hash:string,
  sign:Sign
}

export type ethereum_header = {
  difficulty: string,
  extraData: string,
  hash: string,
  logsBloom: string,
  miner: string,
  number: string,
  parentHash: string,
  receiptsRoot: string,
  signature: string,
  size: string,
  stateRoot: string,
  timestamp: string,
  totalDifficulty: string,
  transactionsRoot: string,
}
