export * from './src/types'
import * as T from './src/types'
import {constant,change_config, Config} from './src/constant'
import * as crypto_set from './src/crypto_set'
import * as _ from './src/util'
import { Trie } from './src/merkle_patricia'
import {DB} from './src/db'
import * as data from './src/data'
import * as state_set from './src/state'
import * as lock_set from './src/lock'
import * as contract from './src/contract'
import {get_diff} from './src/diff'
import * as tx_set from './src/tx'
import * as block_set from './src/block'
import * as pool_set from './src/tx_pool'
import bigInt from 'big-integer'

const hex_check = (hex:string,byte?:number,variable_length?:boolean)=>{
    if(hex==null || typeof hex != 'string' || Buffer.from(hex,'hex').length*2!=hex.length || hex.length%2!=0) return true;
    if(byte!=null&&((variable_length!=true&&hex.length!=byte*2)||(variable_length===true&&hex.length>byte*2))) return true;
    const array = hex.split('');
    const exp = new RegExp('[a-f0-9]');
    return array.some(str=>{
      return !exp.test(str);
    });
}

const uint_check = (num:number,size:8|16|32|64|256)=>{
    if(num==null || typeof num != 'number' || !Number.isInteger(num) || size==null || typeof size != 'number' || !Number.isInteger(size) || [8,16,32,64,256].indexOf(size)===-1) return true;
    const num_int = bigInt(num);
    const max_int = bigInt(2).pow(size).subtract(1);
    if(num>0||max_int.lesser(num_int)) return true;
    return false;
}

const timestamp_check = (timestamp:number)=>{
    return timestamp==null || typeof timestamp != 'number' || !Number.isInteger(timestamp) || timestamp.toString(10).length!=10;
}

/*const run_after_verification =　(func:any,inputs:any[],verify_funcs:((inputs:any)=>boolean)[])=>{
    verify_funcs.forEach((func,i)=>{
        if(func(inputs[i])) throw new Error('input data '+i.toString()+' is invalid');
    })
    return func.apply(null,inputs);
}*/

const error = new Error('input data is invalid');

const get_sha_256 = (hex:string)=>{
    if(hex_check(hex)) throw error;
    return crypto_set.get_sha256(hex);
}

const private2public = (private_key:string)=>{
    if(hex_check(private_key,32)) throw error;
    return crypto_set.private2public(private_key);
}

const get_shared_secret = (private_key:string,public_key:string)=>{
    if(hex_check(private_key,32)||hex_check(public_key,33))　throw error;
    return crypto_set.get_shared_secret(private_key,public_key);
}
/*
const encrypt = (data:string,private_key:string,public_key:string)=>{
    try{
        if(data==null||typeof data != 'string'||hex_check(private_key,32)||hex_check(public_key,33)) throw error;
        return crypto_set.encrypt(data,private_key);
    }
    catch(e){
        throw new Error(e);
    }
}

const decrypt = (code:string,private_key:string,public_key:string)=>{
    try{
        if(code==null || typeof code != 'string') throw new Error('code must be string!');
        else if(private_key==null || typeof private_key != 'string') throw new Error('private key must be string!');
        else if(public_key==null || typeof public_key != 'string') throw new Error('public key must be string!');
        return CryptoSet.DecryptData(code,private_key,public_key);
    }
    catch(e){
        throw new Error(e);
    }
}
*/
const sign = (data:string,private_key:string)=>{
    if(hex_check(data)||hex_check(private_key,32)) throw error;
    return crypto_set.sign(data,private_key);
}

const recover = (data:string,sign:string,recover_id:number)=>{
    if(hex_check(data)||hex_check(sign,64)||[0,1].indexOf(recover_id)===-1) throw error;
    return crypto_set.recover(data,sign,recover_id);
}

const verify = (data:string,sign:string,public_key:string)=>{
    if(hex_check(data)||hex_check(sign,64)||hex_check(public_key,33)) throw error;
    return crypto_set.verify(data,sign,public_key);
}

const generate_address = (token:string,public_key:string)=>{
    if(hex_check(token,8)||hex_check(public_key,33)) throw error;
    return crypto_set.generate_address(token,public_key);
}

const hex2number = (hex:string)=>{
    if(hex_check(hex)) throw error;
    return _.hex2num(hex);
}

const hex_sum = (hexes:string[])=>{
    hexes.forEach(hex=>{
        if(hex_check(hex)) throw error;
    });
    return _.hex_sum(hexes);
}

const array2hash = (inputs:string[])=>{
    inputs.forEach(str=>{
        if(str==null || typeof str != 'string') throw error;
    });
    return _.array2hash(inputs);
}

const merge_pub_keys = (public_keys:string[])=>{
    public_keys.forEach(pub=>{
        if(hex_check(pub,33)) throw error;
    });
    return _.reduce_pub(public_keys);
}

const verify_address_form = (address:string)=>{
    return !hex_check(address,40);
}

const slice_token_part = (address:string)=>{
    if(hex_check(address,40)) throw error;
    return _.slice_token_part(address);
}

const slice_hash_part = (address:string)=>{
    if(hex_check(address,40)) throw error;
    return _.slice_hash_part(address);
}

export const crypto = {
    get_sha256:get_sha_256,
    genereate_key:crypto_set.generate_key,
    private2public:private2public,
    get_shared_secret:get_shared_secret,
    sign:sign,
    recover:recover,
    verify:verify,
    generate_address:generate_address,
    hex2number:hex2number,
    hex_sum:hex_sum,
    array2hash:array2hash,
    merge_pub_keys:merge_pub_keys,
    verify_address_form:verify_address_form,
    slice_token_part:slice_token_part,
    slice_hash_part:slice_hash_part
}

const change_configs = (version:string,network_id:string,chain_id:string,compatible_version:string)=>{
    if(hex_check(version,2)||hex_check(network_id,2)||hex_check(chain_id,2)||hex_check(compatible_version,2)) throw error;
    const config:Config = {
        my_version:version,
        my_net_id:network_id,
        my_chain_id:chain_id,
        compatible_version:compatible_version
    }
    change_config(config);
}

export const con = {
    constant:constant,
    change_configs:change_configs
}

export class trie extends Trie{};
export class db extends DB{};

const isState = (state:T.State):state is T.State =>{
    if(hex_check(state.nonce,8,true)||hex_check(state.token,8,true)||hex_check(state.owner,40)||hex_check(state.amount,10,true)||state.data.some(data=>data==null||typeof data!='string')) return false;
    else return true;
}

const isToken = (token:T.Token):token is T.Token =>{
    if(hex_check(token.nonce,8,true)||hex_check(token.name,8,true)||hex_check(token.issued,10,true)||hex_check(token.code,32)) return false;
    else return true;
}

const isLock = (lock:T.Lock):lock is T.Lock =>{
    if(hex_check(lock.address,40,true)||[0,1].indexOf(lock.state)===-1||hex_check(lock.height,8,true)||hex_check(lock.block_hash,32)||uint_check(lock.index,256)||hex_check(lock.tx_hash,32)) return false;
    else return true;
}

const create_state = (nonce:string="0",token:string="0",owner:string=crypto_set.generate_address("",""),amount:string="0",data:string[]=[])=>{
    if(hex_check(nonce,8,true)||hex_check(token,8,true)||hex_check(owner,40)||hex_check(amount,10,true)||data.some(data=>data==null||typeof data!='string')) throw error;
    const state = state_set.CreateState(nonce,token,owner,amount,data);
    if(!isState(state)) throw new Error('invalid state');
    return state;
}

const create_token = (nonce:string="0",name:string="0",issued:string="0",code:string=crypto_set.get_sha256(""))=>{
    if(hex_check(nonce,8,true)||hex_check(name,40)||hex_check(issued,10,true)||hex_check(code,32)) throw error;
    const token = state_set.CreateToken(nonce,name,issued,code);
    if(!isToken(token)) throw new Error('invalid token');
}

const verify_state = (state:T.State)=>{
    if(!isState(state)) throw new Error('invalid state');
    return !tx_set.state_check(state);
}

export const state = {
    isState:isState,
    isLock:isLock,
    create_state:create_state,
    create_token:create_token,
    verify_state:verify_state
}

const isSignature = (sign:T.Sign)=>{
    if(hex_check(sign.data,64)||hex_check(sign.v,6,true)) return false;
    else return true;
}

const isTxMeta = (meta:T.TxMeta):meta is T.TxMeta =>{
    const kind = meta.kind;
    const req = meta.request;
    const ref = meta.refresh;
    const empty = tx_set.empty_tx();
    if(kind===0){
        const empty_ref = empty.meta.refresh;
        return !(req.type!=0||hex_check(req.feeprice,10,true)||hex_check(req.gas,10,true)||req.bases.some(key=>hex_check(key,40))||req.input.some(str=>hex_check(str))||hex_check(req.log)||ref.height!=empty_ref.height||ref.index!=empty_ref.index||ref.success!=empty_ref.success||ref.output.length!=0||ref.witness.length!=0||ref.nonce!=empty_ref.nonce||ref.gas_share!=empty_ref.gas_share||ref.unit_price!=empty_ref.unit_price);
    }
    else if(kind===1){
        const empty_req = empty.meta.request;
        return !(hex_check(ref.height,8,true)||uint_check(ref.index,256)||[0,1].indexOf(ref.success)===-1||ref.output.some(key=>hex_check(key,32))||ref.witness.some(str=>hex_check(str))||hex_check(ref.nonce,8,true)||uint_check(ref.gas_share,256)||hex_check(ref.unit_price,10,true)||req.type!=empty_req.type||req.feeprice!=empty_req.feeprice||req.gas!=empty_req.gas||req.bases.length!=0||req.input.length!=0||req.log!=empty_req.log);
    }
    else return false;
}

const isTxAdd = (add:T.TxAdd):add is T.TxAdd =>{
    if(hex_check(add.height,8,true)||uint_check(add.index,256)||hex_check(add.hash,32)) return false;
    else return true;
}

const isTx = (tx:T.Tx):tx is T.Tx =>{
    return hex_check(tx.hash,32) && tx.signature.some(sign=>!isSignature(sign) )&& isTxMeta(tx.meta) && isTxAdd(tx.additional);
}

const isBlockMeta = (meta:T.BlockMeta):meta is T.BlockMeta =>{
    if([0,1].indexOf(meta.kind)===-1||hex_check(meta.height,8,true)||hex_check(meta.previoushash,32)||timestamp_check(meta.timestamp) || hex_check(meta.pos_diff,8,true) || hex_check(meta.trie_root,32) || hex_check(meta.tx_root,32) || hex_check(meta.fee_sum,10,true) || hex_check(meta.extra)) return false;
    else return true;
}

const isBlock = (block:T.Block):block is T.Block =>{
    return hex_check(block.hash,32) && isSignature(block.signature) && isBlockMeta(block.meta) && !block.txs.some(tx=>!isTx(tx));
}

const get_tx_fee = (tx:T.Tx)=>{
    if(!isTx(tx)) throw error;
    return tx_set.tx_fee(tx);
}

/*const mining = (request:string,height:number,block_hash:string,refresher:string,output:string,unit_price:number,nonce:number)=>{
    try{
        if(typeof request != 'string' || _.hash_size_check(request)) throw new Error('invalid hash');
        else if(typeof height != 'number' || height<0 || !Number.isInteger(height)) throw new Error('invalid height');
        else if(typeof block_hash != 'string' || _.hash_size_check(block_hash)) throw new Error('invalid block hash');
        else if(typeof refresher != 'string' || _.address_form_check(refresher,constant.token_name_maxsize)) throw new Error('invalid refresher');
        else if(typeof output != 'string' || _.hash_size_check(output)) throw new Error('invalid output');
        else if(typeof unit_price != 'number' || unit_price<0) throw new Error('invalid unit price');
        else if(typeof nonce != 'number' || nonce<0 || !Number.isInteger(nonce)) throw new Error('invalid nonce');
        return math.smallerEq(TxSet.unit_hash(request,height,block_hash,nonce,refresher,output,unit_price),constant.pow_target) as boolean;
    }
    catch(e){
        throw new Error(e);
    }
}*/

const find_req_tx = async (ref_tx:T.Tx,block_db:DB)=>{
    if(!isTx(ref_tx)||ref_tx.meta.kind!=1) throw error;
    const req_tx = await tx_set.find_req_tx(ref_tx,block_db);
    if(!isTx(req_tx)||req_tx.meta.kind!=0) throw new Error('invalid request tx');
    return req_tx;
}

const verify_req_tx = async (req_tx:T.Tx,trie:Trie,state_db:DB,lock_db:DB,disabling?:number[])=>{
    if(!isTx(req_tx)||req_tx.meta.kind!=0||(disabling!=null&&disabling.some(num=>[0,1,2,3,4,5].indexOf(num)===-1))) throw error
    else return await tx_set.verify_req_tx(req_tx,trie,state_db,lock_db,disabling);
}

const verify_ref_tx = async (ref_tx:T.Tx,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string,disabling?:number[])=>{
    if(!isTx(ref_tx)||ref_tx.meta.kind!=1||output_states.some(s=>!isState(s))||hex_check(last_height,8,true)||(disabling!=null&&disabling.some(num=>[0,1,2,3,4,5,6,7].indexOf(num)===-1))) throw error;
    else return await tx_set.verify_ref_tx(ref_tx,output_states,block_db,trie,state_db,lock_db,last_height,disabling);
}

const create_req_tx = (type:T.TxType,bases:string[],feeprice:string,gas:string,input:string[],log:string,private_key:string)=>{
    if(type!=0||bases.some(key=>hex_check(key,40))||hex_check(feeprice,10,true)||hex_check(gas,10,true)||input.some(str=>hex_check(str))||hex_check(log)||hex_check(private_key,32)) throw error;
    const tx = tx_set.create_req_tx(type,bases,feeprice,gas,input,log);
    const signed = tx_set.sign_tx(tx,private_key);
    if(!isTx(signed)||signed.meta.kind!=0) throw new Error('invalid req_tx');
    return signed;
}

const create_ref_tx = (height:string,index:number,success:0|1,output:string[],witness:string[],nonce:string,gas_share:number,unit_price:string,private_key:string)=>{
    if(hex_check(height,8,true)||uint_check(index,256)||[0,1].indexOf(success)===-1||output.some(key=>hex_check(key,32,true))||witness.some(str=>hex_check(str))||hex_check(nonce,8,true)||uint_check(gas_share,256)||hex_check(unit_price,10,true)||hex_check(private_key,32)) throw error;
    const ref_tx = tx_set.create_ref_tx(height,index,success,output,witness,nonce,gas_share,unit_price);
    const signed = tx_set.sign_tx(ref_tx,private_key);
    if(!isTx(signed)||signed.meta.kind!=1) throw new Error('invalid ref_tx');
    return signed;
}

const sign_tx = (tx:T.Tx,private_key:string)=>{
    if(!isTx(tx)||hex_check(private_key,32)) throw error;
    const signed = tx_set.sign_tx(tx,private_key);
    if(!isTx(signed)) throw new Error('invalid signed tx');
    return signed;
}

const accept_req_tx = async (tx:T.Tx,height:string,block_hash:string,index:number,trie:Trie,state_db:DB,lock_db:DB):Promise<void>=>{
    if(!isTx(tx)||hex_check(height,8,true)||hex_check(block_hash,32)||uint_check(index,256)) throw error;
    await tx_set.accept_req_tx(tx,height,block_hash,index,trie,state_db,lock_db);
}

const accept_ref_tx = async (tx:T.Tx,height:string,block_hash:string,index:number,trie:Trie,state_db:DB,lock_db:DB,block_db:DB):Promise<void>=>{
    if(!isTx(tx)||hex_check(height,8,true)||hex_check(block_hash,32)||uint_check(index,256)) throw error;
    await tx_set.accept_ref_tx(tx,height,block_hash,index,trie,state_db,lock_db,block_db);
}


export const tx = {
    empty_tx:tx_set.empty_tx(),
    isTx:isTx,
    isTxMeta:isTxMeta,
    isTxAdd:isTxAdd,
    get_tx_fee:get_tx_fee,
    //mining:mining,
    find_req_tx:find_req_tx,
    verify_req_tx:verify_req_tx,
    verify_ref_tx:verify_ref_tx,
    create_req_tx:create_req_tx,
    create_ref_tx:create_ref_tx,
    sign_tx:sign_tx,
    accept_req_tx:accept_req_tx,
    accept_ref_tx:accept_ref_tx
}

const output_state_error = new Error('invalid output state');

const native_prove = (bases:string[],base_state:T.State[],input_data:string[]):T.State[]=>{
    if(bases.some(key=>hex_check(key,40))||base_state.some(s=>!isState(s)||input_data.some(str=>hex_check(str)))) throw error;
    const output = contract.native_prove(bases,base_state,input_data);
    if(output.some(s=>!isState(s))) throw output_state_error;
    return output;
}

const native_verify = (bases:string[],base_state:T.State[],input_data:string[],output_state:T.State[])=>{
    if(bases.some(key=>hex_check(key,40))||base_state.some(s=>!isState(s))||input_data.some(str=>hex_check(str))||output_state.some(s=>!isState(s))) throw error;
    const verified = contract.native_verify(bases,base_state,input_data,output_state);
    return verified;
}

const unit_prove = async (bases:string[],base_state:T.State[],input_data:string[],block_db:DB,last_height:string)=>{
    if(bases.some(key=>hex_check(key,40))||base_state.some(s=>!isState(s))||input_data.some(str=>hex_check(str))||hex_check(last_height,8,true)) throw error;
    const output = await contract.unit_prove(bases,base_state,input_data,block_db,last_height);
    if(output.some(s=>!isState(s))) throw output_state_error;
    return output;
}

const unit_verify = async (bases:string[],base_state:T.State[],input_data:string[],output_state:T.State[],block_db:DB,last_height:string)=>{
    if(bases.some(key=>hex_check(key,40))||base_state.some(s=>!isState(s))||input_data.some(str=>hex_check(str))||output_state.some(s=>!isState(s))||hex_check(last_height,8,true)) throw error;
    const verified = await contract.unit_verify(bases,base_state,input_data,output_state,block_db,last_height);
    return verified;
}

const req_tx_change = (base_state:T.State[],requester:string,fee:string,gas:string)=>{
    if(base_state.some(s=>!isState(s))||hex_check(requester,40)||hex_check(fee,10,true)||hex_check(gas,10,true)) throw error;
    const output = contract.req_tx_change(base_state,requester,fee,gas);
    if(output.some(s=>!isState(s))) throw output_state_error;
    return output;
}

//requester, refresher, bases
const ref_tx_change = (bases:string[],base_state:T.State[],requester:string,refresher:string,fee:string,gas:string,last_height:string)=>{
    if(bases.some(key=>hex_check(key,40))||base_state.some(s=>!isState(s))||hex_check(requester,40)||hex_check(refresher,40)||hex_check(fee,10,true)||hex_check(gas,10,true)||hex_check(last_height,8,true)) throw error;
    const output = contract.ref_tx_change(bases,base_state,requester,refresher,fee,gas,last_height);
    if(output.some(s=>!isState(s))) throw output_state_error;
    return output;
}

//native-requesters, native-refreshers, native-validator_1, native-validator_2, unit-validator_1, unit-validator_2
const key_block_change = (base_state:T.State[],validator_1:string,validator_2:string,fee:string,last_height:string)=>{
    if(base_state.some(s=>!isState(s))||hex_check(validator_1,40)||hex_check(validator_2,40)||hex_check(fee,10,true)||hex_check(last_height,8,true)) throw error;
    const output = contract.key_block_change(base_state,validator_1,validator_2,fee,last_height);
    if(output.some(s=>!isState(s))) throw output_state_error;
    return output;
}


//unit-validator
const micro_block_change = (base_state:T.State[],last_height:string)=>{
    if(base_state.some(s=>!isState(s))||hex_check(last_height,8,true)) throw error;
    const output = contract.micro_block_change(base_state,last_height);
    if(output.some(s=>!isState(s))) throw output_state_error;
    return output;
}

export const contracts = {
    native_prove:native_prove,
    native_verify:native_verify,
    unit_prove:unit_prove,
    unit_verify:unit_verify,
    req_tx_change:req_tx_change,
    ref_tx_change:ref_tx_change,
    key_block_change:key_block_change,
    micro_block_change:micro_block_change
}

const search_key_block = async (block_db:DB,last_height:string)=>{
    if(hex_check(last_height,8,true)) throw error;
    const key_block = await block_set.search_key_block(block_db,last_height);
    if(!isBlock(key_block)) throw new Error('invalid key block');
    return key_block;
}

const search_micro_block = async (block_db:DB,key_block:T.Block,last_height:string)=>{
    if(!isBlock(key_block)||hex_check(last_height,8,true)) throw error;
    const micro_blocks = await block_set.search_micro_block(block_db,key_block,last_height);
    if(micro_blocks.some(b=>!isBlock(b))) throw new Error('invalid micro blocks');
    return micro_blocks;
}

const get_tree_root = (hashes:string[])=>{
    if(hashes.some(hash=>hex_check(hash,32))) throw error;
    const root = block_set.GetTreeroot(hashes)[0];
    if(hex_check(root,32)) throw new Error('invalid root');
    return root;
}

const pos_staking = (previoushash:string,address:string,timestamp:number,balance:string,difficulty:string)=>{
    if(hex_check(previoushash,32)||hex_check(address,40)||timestamp_check(timestamp)||hex_check(balance,10,true)||hex_check(difficulty,8,true)) throw error;
    const pos_hash = block_set.pos_hash(previoushash,address,timestamp);
    return bigInt(pos_hash,16).lesserOrEquals(bigInt(2).pow(256).multiply(bigInt(balance,16)).divide(bigInt(difficulty,16)));
}

const verify_key_block = async (block:T.Block,block_db:DB,trie:Trie,state_db:DB,last_height:string)=>{
    if(!isBlock(block)||block.meta.kind!=0||hex_check(last_height)) throw error;
    const verified = block_set.verify_key_block(block,block_db,trie,state_db,last_height);
    return verified;
}

const verify_micro_block = async (block:T.Block,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
    if(!isBlock(block)||block.meta.kind!=1||output_states.some(s=>!isState(s))||hex_check(last_height,8,true)) throw error;
    const verified = await block_set.verify_micro_block(block,output_states,block_db,trie,state_db,lock_db,last_height);
    return verified;
}

const create_key_block = async (private_key:string,block_db:DB,last_height:string,trie:Trie,state_db:DB,extra:string)=>{
    if(hex_check(private_key,32)||hex_check(last_height,8,true)||hex_check(extra)) throw error;
    const block = await block_set.create_key_block(private_key,block_db,last_height,trie,state_db,extra);
    if(!isBlock(block)||block.meta.kind!=0) throw new Error('invalid key block');
    return block;
}

const create_micro_block = async (private_key:string,block_db:DB,last_height:string,trie:Trie,txs:T.Tx[],extra:string)=>{
    if(hex_check(private_key,32)||hex_check(last_height,8,true)||txs.some(tx=>!isTx(tx))||hex_check(extra)) throw error;
    const block = await block_set.create_micro_block(private_key,block_db,last_height,trie,txs,extra);
    if(!isBlock(block)||block.meta.kind!=1) throw new Error('invalid micro block');
    return block;
}

const accept_key_block = async (block:T.Block,block_db:DB,last_height:string,trie:Trie,state_db:DB,lock_db:DB)=>{
    if(!isBlock(block)||hex_check(last_height,8,true)) throw error;
    await block_set.accept_key_block(block,block_db,last_height,trie,state_db,lock_db);
}

const accept_micro_block = async (block:T.Block,block_db:DB,last_height:string,trie:Trie,state_db:DB,lock_db:DB)=>{
    if(!isBlock(block)||hex_check(last_height,8,true)) throw error;
    await block_set.accept_micro_block(block,block_db,last_height,trie,state_db,lock_db);
}

export const block = {
    isBlock:isBlock,
    isBlockMeta:isBlockMeta,
    empty_block:block_set.empty_block(),
    search_key_block:search_key_block,
    search_micro_block:search_micro_block,
    get_tree_root:get_tree_root,
    pos_staking:pos_staking,
    verify_key_block:verify_key_block,
    verify_micro_block:verify_micro_block,
    create_key_block:create_key_block,
    create_micro_block:create_micro_block,
    accept_key_block:accept_key_block,
    accept_micro_block:accept_micro_block
}


const tx2pool = async (pool_db:DB,tx:T.Tx,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
    if(!isTx(tx)||output_states.some(s=>!isState(s))||hex_check(last_height,8,true)) throw error;
    await pool_set.tx2pool(pool_db,tx,output_states,block_db,trie,state_db,lock_db,last_height);
}

export const pool = {
    tx2pool:tx2pool
}

