import * as _ from './util'
import * as crypto_set from './crypto_set'
import * as T from './types'
import * as state_set from './state'
import * as lock_set from './lock'
import * as block_set from './block'
import { Trie } from './merkle_patricia';
import {DB} from './db';
import * as data from './data'
import {constant} from './constant'
import * as contracts from './contract'
import bigInt, { BigInteger } from 'big-integer'
import * as P from 'p-iteration'


export const empty_tx = ():T.Tx=>{
  const request:T.Request = {
    type:0,
    nonce:"",
    feeprice:"",
    gas:"",
    bases:[],
    input:[],
    log:""
  }
  const refresh:T.Refresh = {
    height:"",
    index:0,
    success:0,
    output:[],
    witness:[],
    nonce:"",
    gas_share:0,
    unit_price:""
  }
  const meta:T.TxMeta = {
    kind:0,
    request:request,
    refresh:refresh
  }

  const add:T.TxAdd = {
    height:"",
    hash:"",
    index:0
  }

  const hash = "";

  return {
    hash:hash,
    signature:[],
    meta:meta,
    additional:add
  };
}


export const requested_check = async (base:string[],trie:Trie,lock_db:DB)=>{
  return await P.some(base, async key=>{
    const get:T.Lock = await data.read_from_trie(trie,lock_db,key,1,lock_set.CreateLock(key));
    return get.state===1;
  });
}

//require info about request-tx
export const refreshed_check = async (base:string[],trie:Trie,lock_db:DB)=>{
  return await P.some(base, async key=>{
    const get:T.Lock = await data.read_from_trie(trie,lock_db,key,1,lock_set.CreateLock(key));
    return get.state===0;
  });
}

export const state_check = (state:T.State):boolean=>{
  return _.address_form_check(state.owner) || bigInt(_.slice_token_part(state.owner),16).notEquals(bigInt(state.token,16));
}

export const tx_meta2array = (meta:T.TxMeta):string[]=>{
  const req = meta.request;
  const ref = meta.refresh;
  const kind = "0"+meta.kind;
  const type = "0"+req.type.toString(16);
  let index = ref.index.toString(16);
  if(index.length%2!=0) index = "0"+index;
  const success = "0"+ref.success.toString(16);
  let gas_share = ref.gas_share.toString(16);
  if(gas_share.length%2!=0) gas_share = "0"+gas_share;
  return [kind,type,req.nonce,req.feeprice,req.gas,req.log,ref.height,index,success,ref.nonce,gas_share].concat(req.bases).concat(req.input).concat(ref.output).concat(ref.witness);
}

export const tx_fee = (tx:T.Tx):string=>{
  const price = tx.meta.request.feeprice;
  const meta = tx.meta;
  const sign = tx.signature.map(s=>s.data+s.v);
  const array = tx_meta2array(meta).splice(2,1).concat(tx.hash).concat(sign);
  const size_sum = array.reduce((sum:BigInteger,item:string)=>{
    return sum.add(Math.ceil(Buffer.from(item,'hex').length))
  },bigInt(0));
  return _.bigInt2hex(size_sum.multiply(price));
}


export const unit_hash = async (request:string,height:string,block_hash:string,nonce:string,refresher:string,output:string,unit_price:string):Promise<string>=>{
  return await crypto_set.compute_cryptonight(_.array2hash([request,height,block_hash,nonce,refresher,output,unit_price]));
}

/*export const find_req_tx = (ref_tx:T.Tx,chain:T.Block[]):T.Tx=>{
  const height = ref_tx.meta.height || 0;
  const block = chain[height] || BlockSet.empty_block();
  if(block.hash!=ref_tx.meta.block_hash) return empty_tx();
  const req_pure = block.txs[ref_tx.meta.index];
  if(req_pure==null) return empty_tx();
  const req_raw = block.raws[ref_tx.meta.index];
  if(req_raw==null) return empty_tx();
  return {
    hash:req_pure.hash,
    meta:req_pure.meta,
    raw:req_raw,
    additional:req_pure.additional
  }
}*/

const base_declaration_check = async (target:T.State,bases:string[])=>{
  return bases.indexOf(target.owner)===-1;
}

const output_change_check = async (bases:string[],new_states:T.State[])=>{
  return P.some(new_states, async s=>{
    return state_check(s) || await base_declaration_check(s,bases);
  });
}

/*const output_create_check = (token_state:T.State,code:string,StateData:T.State[])=>{
  const getted:T.State = StateData.filter(s=>s.kind==="info"&&s.token===token_state.token)[0];
  if(getted!=null||token_state.nonce!=0||math.smaller(token_state.amount,0)||math.smaller(token_state.issued,0)||token_state.code!=_.toHash(code)) return true;
  else return false;
}*/
export const find_req_tx = async (ref_tx:T.Tx,block_db:DB)=>{
  const height = ref_tx.meta.refresh.height;
  const index = ref_tx.meta.refresh.index;
  const block:T.Block = await block_db.read_obj(height) || block_set.empty_block();
  const req_tx:T.Tx|null = block.txs[index];
  if(req_tx==null || req_tx.meta.kind!=0) return empty_tx();
  return req_tx;
}

export const get_info_from_tx = (tx:T.Tx):[string,string[],string[],string[],string]=>{
  const sign = tx.signature;
  const meta = tx.meta;
  const sign_data = sign.map(s=>s.data);
  const meta_array = tx_meta2array(meta);
  const recover_ids = sign.map(s=>{
    return bigInt(s.v,16).mod(2).toJSNumber();
  });
  const ids = sign.map((s,i)=>{
    return ("000000000000"+_.bigInt2hex(bigInt(bigInt(s.v,16).minus(8).minus(28-recover_ids[i])).divide(2))).slice(-12);
  });
  const data_array = meta_array.concat(ids[0]);
  const meta_hash = _.array2hash(data_array);
  const pub_keys = sign_data.map((s,i)=>{
    return crypto_set.recover(meta_hash,s,recover_ids[i]);
  });
  const address = crypto_set.generate_address(constant.native,_.reduce_pub(pub_keys));
  const all_array = meta_array.concat(sign.map(s=>s.v));
  return [meta_hash,all_array,ids,pub_keys,address];
}

export const contract_check = async (token:string,bases:string[],base_state:T.State[],input_data:string[],output_state:T.State[],block_db?:DB,last_height?:string)=>{
  if(bigInt(token,16).eq(bigInt(constant.native,16))){
    return !contracts.native_verify(bases,base_state,input_data,output_state);
  }
  else if(bigInt(token,16).eq(bigInt(constant.unit,16))&&block_db!=null&&last_height!=null){
    return !contracts.unit_verify(bases,base_state,input_data,output_state,block_db,last_height);
  }
  else return true;
}

const verify_tx_basic = (hash:string,sign:T.Sign[],meta_hash:string,ids:string[],pub_keys:string[],address:string)=>{
  const version = ids[0].slice(0,4);
  const chain_id = ids[0].slice(4,8);
  const net_id = ids[0].slice(8,12);
  if(hash!=meta_hash){
    //console.log("invalid hash");
    return false;
  }
  else if(ids.some(id=>ids.indexOf(id)!=0)){
    //console.log("invalid ids");
    return false;
  }
  else if(bigInt(version,16).lesser(bigInt(constant.compatible_version,16))){
    //console.log("different version");
    return false;
  }
  else if(bigInt(chain_id,16).notEquals(bigInt(constant.my_chain_id,16))){
    //console.log("different chain id");
    return false;
  }
  else if(bigInt(net_id,16).notEquals(bigInt(constant.my_net_id,16))){
    //console.log("different network id");
    return false;
  }
  else if(_.address_check(address,_.reduce_pub(pub_keys),constant.native)){
    //console.log("invalid address");
    return false;
  }
  else if(sign.length===0||sign.some((s,i)=>_.sign_check(hash,s.data,pub_keys[i]))){
    //console.log("invalid signature");
    return false;
  }
  else{
    return true;
  }
}

export const verify_req_tx = async (tx:T.Tx,trie:Trie,state_db:DB,lock_db:DB,disabling:number[]=[])=>{
  const meta = tx.meta;
  const kind = meta.kind;
  const req = meta.request;
  const nonce = req.nonce;
  const gas = req.gas;
  const bases = req.bases;

  const pulled = get_info_from_tx(tx);
  const meta_hash = pulled[0];
  const ids = pulled[2];
  const pub_keys = pulled[3];
  const requester = pulled[4];

  const tokens = _.slice_tokens(bases);

  const requester_state:T.State = await data.read_from_trie(trie,state_db,requester,0,state_set.CreateState("00",constant.native,requester,"00",[]));

  const base_states:T.State[] = await P.map(bases,async key=>{
    return await data.read_from_trie(trie,state_db,key,0,state_set.CreateState("00",_.slice_token_part(key),key,"00",[]));
  });

  if(disabling.indexOf(0)===-1&&!verify_tx_basic(tx.hash,tx.signature,meta_hash,ids,pub_keys,requester)){
    return false;
  }
  else if(disabling.indexOf(1)===-1&&kind!=0){
    //console.log("invalid kind");
    return false;
  }
  else if(disabling.indexOf(2)===-1&&_.slice_hash_part(bases[0])!=_.slice_hash_part(requester)||requester_state==null||_.hashed_pub_check(requester,pub_keys)||bigInt(requester_state.token,16).notEquals(bigInt(constant.native,16))||bigInt(requester_state.amount,16).subtract(bigInt(tx_fee(tx),16)).subtract(bigInt(gas,16)).lesser(0)){
    //console.log("invalid requester");
    return false;
  }
  else if(disabling.indexOf(3)===-1&&tokens.length<1||tokens.length>5){
    //console.log("invalid token");
    return false;
  }
  else if(disabling.indexOf(4)===-1&&bases.some((key,i,array)=>array.indexOf(key)!=i)||base_states.some(s=>tokens.indexOf(("0000000000000000"+s.token).slice(-16))===-1)||bases.length!=base_states.length){
    //console.log("invalid base");
    return false;
  }
  else if(disabling.indexOf(5)===-1&&await requested_check(bases,trie,lock_db)){
    //console.log("base states are already requested");
    return false;
  }
  else if(disabling.indexOf(6)===-1&&bigInt(base_states[0].nonce,16).notEquals(bigInt(nonce,16))){
    //console.log("invalid nonce");
    return false;
  }
  else{
    return true;
  }
}


export const verify_ref_tx = async (tx:T.Tx,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string,disabling:number[]=[])=>{
  const meta = tx.meta;
  const kind = meta.kind;
  const ref = meta.refresh;

  const height = ref.height;
  const success = ref.success;
  const output = ref.output;
  const nonce = ref.nonce;
  const gas_share = ref.gas_share;
  const unit_price = ref.unit_price;

  const block:T.Block = await block_db.read_obj(height) || block_set.empty_block();
  const pow_target = constant.pow_target;
  const req_tx = await find_req_tx(tx,block_db);
  if(req_tx.hash==="") return false;
  const gas = bigInt(req_tx.meta.request.gas,16).multiply(gas_share).divide(100);
  const fee = bigInt(req_tx.meta.request.gas,16).subtract(gas);

  const pulled = get_info_from_tx(tx);
  const meta_hash = pulled[0];
  const ids = pulled[2];
  const pub_keys = pulled[3];
  const refresher = pulled[4];

  const refresher_state:T.State = await data.read_from_trie(trie,state_db,refresher,0,state_set.CreateState("00",constant.native,refresher));

  const unit_add = crypto_set.generate_address(constant.unit,_.reduce_pub(pub_keys));

  const main_token = _.slice_token_part(req_tx.meta.request.bases[0]);
  const bases = req_tx.meta.request.bases;
  const base_states:T.State[] = await P.map(bases, async key=>{
    return await data.read_from_trie(trie,state_db,key,0,state_set.CreateState("00",_.slice_token_part(key),key,"00",[]));
  });
  const base_states_hashes = base_states.map(s=>_.array2hash([s.nonce,s.token,s.owner,s.amount].concat(s.data)));

  if(disabling.indexOf(0)===-1&&!verify_tx_basic(tx.hash,tx.signature,meta_hash,ids,pub_keys,refresher)){
    return false;
  }
  else if(disabling.indexOf(1)===-1&&kind!=1){
    //console.log("invalid kind");
    return false;
  }
  else if(disabling.indexOf(2)===-1&&req_tx.hash==""){
    //console.log("invalid request hash");
    return false;
  }
  else if(disabling.indexOf(3)===-1&&!bigInt(await unit_hash(req_tx.hash,height,block.hash,nonce,unit_add,_.array2hash(output),unit_price),16).lesserOrEquals(bigInt(pow_target,16))){
    //console.log("invalid nonce");
    return false;
  }
  else if(disabling.indexOf(4)===-1&&await refreshed_check(bases,trie,lock_db)){
    //console.log("base states are already refreshed");
    return false;
  }
  else if(disabling.indexOf(5)===-1&&(refresher_state==null||_.hashed_pub_check(refresher,pub_keys)||bigInt(refresher_state.amount,16).add(gas).subtract(fee).lesser(0))){
    //console.log("invalid refresher");
    return false;
  }
  else if(disabling.indexOf(6)===-1&&output.length!=0 && output.some((o,i)=>o!=_.array2hash([output_states[i].nonce,output_states[i].token,output_states[i].owner,output_states[i].amount].concat(output_states[i].data)))){
    //console.log("invalid output hash");
    return false;
  }
  else if(disabling.indexOf(7)===-1&&(success&&req_tx.meta.request.type==0&&(await output_change_check(bases,output_states)||await contract_check(main_token,bases,base_states,req_tx.meta.request.input,output_states,block_db,req_tx.additional.height)))||(!success&&(output.some((o,i)=>o!=base_states_hashes[i])||gas_share!=0))){
    //console.log("invalid output");
    return false;
  }
  else{
    return true;
  }
}


export const create_req_tx = (type:T.TxType,nonce:string,bases:string[],feeprice:string,gas:string,input:string[],log:string)=>{
  const empty = empty_tx();
  const meta:T.TxMeta = {
    kind:0,
    request:{
      type:type,
      nonce:nonce,
      feeprice:feeprice,
      gas:gas,
      bases:bases,
      input:input,
      log:log
    },
    refresh:empty.meta.refresh
  }

  const id = constant.my_version+constant.my_chain_id+constant.my_net_id;
  const hash = _.array2hash(tx_meta2array(meta).concat(id));

  const tx_add:T.TxAdd = {
    height:"00",
    hash:crypto_set.get_sha256(""),
    index:0
  }

  const tx:T.Tx = {
    hash:hash,
    signature:[],
    meta:meta,
    additional:tx_add
  }
  return tx;
}

export const create_ref_tx = (height:string,index:number,success:0|1,output:string[],witness:string[],nonce:string,gas_share:number,unit_price:string)=>{
  const empty = empty_tx();
  const meta:T.TxMeta = {
    kind:1,
    request:empty.meta.request,
    refresh:{
      height:height,
      index:index,
      success:success,
      output:output,
      witness:witness,
      nonce:nonce,
      gas_share:gas_share,
      unit_price:unit_price
    }
  }

  const id = constant.my_version+constant.my_chain_id+constant.my_net_id;
  const hash = _.array2hash(tx_meta2array(meta).concat(id));

  const tx_add:T.TxAdd = {
    height:"00",
    hash:crypto_set.get_sha256(""),
    index:0
  }

  const tx:T.Tx = {
    hash:hash,
    signature:[],
    meta:meta,
    additional:tx_add
  }
  return tx;
}

export const sign_tx = (tx:T.Tx,private_key:string)=>{
  const id = constant.my_version+constant.my_chain_id+constant.my_net_id;
  const sign = crypto_set.sign(tx.hash,private_key);
  const data = sign[1];
  const v = _.bigInt2hex(bigInt(id,16).multiply(2).add(8).add(bigInt(28).subtract(bigInt(sign[0],16))));
  const signature:T.Sign = {
    data:data,
    v:v
  }
  return _.new_obj(
    tx,
    tx=>{
      tx.signature.push(signature);
      return tx
    });
}

export const accept_req_tx = async (tx:T.Tx,height:string,block_hash:string,index:number,trie:Trie,state_db:DB,lock_db:DB)=>{
  const pulled = get_info_from_tx(tx);
  const requester = pulled[4];
  const fee = tx_fee(tx);
  const gas = tx.meta.request.gas;

  const requester_state:T.State = await data.read_from_trie(trie,state_db,requester,0,state_set.CreateState("00",constant.native,requester,"00"));

  const changed_states = contracts.req_tx_change([requester_state],requester,fee,gas);

  const bases = tx.meta.request.bases;
  const base_states = await P.map(bases, async key=>{
    if(key===requester) return changed_states[0];
    return await data.read_from_trie(trie,state_db,key,0,state_set.CreateState("00",_.slice_token_part(key),key,"00"));
  });
  const lock_states = await P.map(bases, async key=>{
    return await data.read_from_trie(trie,lock_db,key,1,lock_set.CreateLock(key));
  });
  const added = lock_states.map(l=>{
    return _.new_obj(
      l,
      l=>{
        l.state = 1;
        l.height = height;
        l.block_hash = block_hash;
        l.index = index;
        l.tx_hash = tx.hash;
        return l;
      }
    );
  });
  await P.forEach(bases, async (key,i)=>{
    await data.write_trie(trie,state_db,lock_db,base_states[i],added[i]);
  });
}

export const accept_ref_tx = async (ref_tx:T.Tx,output_states:T.State[],height:string,block_hash:string,index:number,trie:Trie,state_db:DB,lock_db:DB,block_db:DB)=>{
  const req_tx = await find_req_tx(ref_tx,block_db);
  const requester = get_info_from_tx(req_tx)[4];
  const refresher = get_info_from_tx(ref_tx)[4];
  const gas = _.bigInt2hex(bigInt(req_tx.meta.request.gas,16).multiply(ref_tx.meta.refresh.gas_share).divide(100));
  const fee = _.bigInt2hex(bigInt(req_tx.meta.request.gas,16).subtract(bigInt(gas,16)));

  const bases = req_tx.meta.request.bases;
  const native_base_states = await P.map(bases.filter(key=>bigInt(_.slice_token_part(key),16).eq(bigInt(constant.native,16))), async key=>await data.read_from_trie(trie,state_db,key,0,state_set.CreateState("00",_.slice_token_part(key),key,"00",[])));
  const income_map:{[key:string]:string} = native_base_states.reduce((res:{[key:string]:string},s)=>{
    res[s.owner] = s.data[2] || "00";
    return res;
  },{});
  const changed = await contracts.ref_tx_change(bases,output_states,requester,refresher,fee,gas,height,income_map);

  const lock_states = await P.map(bases, async key=>{
    return await data.read_from_trie(trie,lock_db,key,1,lock_set.CreateLock(key));
  });
  const added = lock_states.map(l=>{
    return _.new_obj(
      l,
      l=>{
        l.state = 0;
        l.height = height;
        l.block_hash = block_hash;
        l.index = index;
        l.tx_hash = ref_tx.hash
        return l;
      }
    );
  });
  await P.forEach(bases, async (key,i)=>{
    await data.write_trie(trie,state_db,lock_db,changed[i],added[i]);
  });
}
