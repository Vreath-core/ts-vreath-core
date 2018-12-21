export type State = {
  kind:"state" | "info";
  nonce:number;
  token: string;
  owner: string;
  amount: number;
  data: {[key:string]: string;};
  issued:number;
  code:string;
};



export type TxKind = 'request' | 'refresh';
export type TxType = 'change' | 'create';

export type TxMeta = {
  kind:TxKind;
  type:TxType;
  version:number;
  network_id:number;
  chain_id:number;
  timestamp:number;
  address:string;
  pub_key:string[];
  feeprice:number;
  gas:number;
  tokens:string[];
  bases:string[];
  input:string;
  height:number;
  block_hash:string;
  index:number;
  req_tx_hash:string;
  success:boolean;
  output:string;
  nonce:number;
  unit_price:number;
  log_hash:string;
}

export type TxRaw = {
  signature:string[];
  raw:string[];
  log:string;
}

export type TxAdd = {
  height:number;
  hash:string;
  index:number;
}

export type TxPure = {
  hash:string;
  meta:TxMeta;
  additional:TxAdd;
}

export type Tx = {
  hash:string;
  meta:TxMeta;
  raw:TxRaw;
  additional:TxAdd;
}

export type Lock = {
  address:string;
  state:'yet' | 'already';
  height:number;
  block_hash:string;
  index:number;
  tx_hash:string;
}


export type BlockKind = "key" | "micro"

export type BlockMeta = {
  kind:BlockKind;
  version:number;
  network_id:number;
  chain_id:number;
  validator:string;
  height:number;
  previoushash:string;
  timestamp: number;
  pos_diff:number;
  validatorPub: string[];
  stateroot: string;
  lockroot: string;
  tx_root: string;
  fee_sum:number;
  extra:string;
}

export type BlockPure = {
  hash:string,
  validatorSign: string[];
  meta:BlockMeta;
}

export type Block = {
  hash:string,
  validatorSign: string[];
  meta:BlockMeta;
  txs:TxPure[];
  raws:TxRaw[];
}

export type Pool = {
  [key:string]:Tx;
}

export type Unit = {
  request:string;
  height:number;
  block_hash:string;
  nonce:number;
  address:string;
  output:string;
  unit_price:number;
}