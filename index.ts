export * from './src/types'
import * as T from './src/types'
import {constant,change_config, Config} from './src/con'
import * as CryptoSet from './src/crypto_set'
import * as _ from './src/basic'
import { Trie } from './src/merkle_patricia'
import * as StateSet from './src/state'
import * as TxSet from './src/tx'
import * as BlockSet from './src/block'
import * as PoolSet from './src/tx_pool'
import * as math from 'mathjs'

math.config({
  number: 'BigNumber'
});

const private2public = (private_key:string)=>{
    if(private_key==null ||typeof　private_key != 'string') throw new Error('private key must be string!');
    return CryptoSet.PublicFromPrivate(private_key);
}

const encrypt = (data:string,private_key:string,public_key:string)=>{
    try{
        if(data==null || typeof data != 'string') throw new Error('data must be string!');
        else if(private_key==null || typeof private_key != 'string') throw new Error('private key must be string!');
        else if(public_key==null || typeof public_key != 'string') throw new Error('public key must be string!');
        return CryptoSet.EncryptData(data,private_key,public_key);
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

const sign = (data:string,private_key:string)=>{
    try{
        if(data==null || typeof data != 'string') throw new Error('data must be string!');
        else if(private_key==null || typeof private_key != 'string') throw new Error('private key must be string!');
        return CryptoSet.SignData(data,private_key);
    }
    catch(e){
        throw new Error(e);
    }
}

const verify = (data:string,sign:string,public_key:string)=>{
    try{
        if(data==null || typeof data != 'string') throw new Error('data must be string!');
        else if(sign==null || typeof sign != 'string') throw new Error('sign must be string!');
        else if(public_key==null || typeof public_key != 'string') throw new Error('public key must be string!');
        return CryptoSet.verifyData(data,sign,public_key);
    }
    catch(e){
        throw new Error(e);
    }
}

const genereate_address = (token:string,public_key:string)=>{
    try{
        if(token==null || typeof token != 'string') throw new Error('token must be string!');
        else if(public_key==null || typeof public_key != 'string') throw new Error('public_key must be string!');
        else if(Buffer.from(token).length>constant.token_name_maxsize) throw new Error('too long token name!');
        return CryptoSet.GenereateAddress(token,public_key);
    }
    catch(e){
        throw new Error(e);
    }
}

const hash = (data:string)=>{
    try{
        if(data==null || typeof data != 'string') throw new Error('data must be string!');
        return _.toHash(data);
    }
    catch(e){
        throw new Error(e);
    }
}

const hash_number = (data:string)=>{
    try{
        if(data==null || typeof data != 'string') throw new Error('data must be string!');
        return _.toHashNum(data);
    }
    catch(e){
        throw new Error(e);
    }
}

const object_hash = <T>(obj:{[key:string]:T}|T[])=>{
    try{
        JSON.stringify(obj,(key,val)=>{
            if(val==null) throw new Error('null exists');
        });
        return _.ObjectHash(obj);
    }
    catch(e){
        throw new Error(e);
    }
}

const object_hash_number = <T>(obj:{[key:string]:T}|T[])=>{
    try{
        JSON.stringify(obj,(key,val)=>{
            if(val==null) throw new Error('null exists');
        });
        return _.Hex_to_Num(_.ObjectHash(obj));
    }
    catch(e){
        throw new Error(e);
    }
}

const merge_pub_keys = (public_keys:string[])=>{
    try{
        public_keys.forEach(pub=>{
            if(pub==null || typeof pub != 'string') throw new Error('public key must be string!');
        });
        return _.reduce_pub(public_keys);
    }
    catch(e){
        throw new Error(e);
    }
}

const verify_address = (address:string)=>{
    try{
        if(address==null || typeof address != 'string') throw new Error('address must be string!');
        return _.address_form_check(address,constant.token_name_maxsize);
    }
    catch(e){
        throw new Error(e);
    }
}

export const crypto = {
    genereate_key:CryptoSet.GenerateKeys,
    private2public:private2public,
    encrypt:encrypt,
    decrypt:decrypt,
    sign:sign,
    verify:verify,
    genereate_address:genereate_address,
    hash:hash,
    hash_number:hash_number,
    object_hash:object_hash,
    object_hash_number:object_hash_number,
    merge_pub_keys:merge_pub_keys,
    verify_address:verify_address
}

const change_configs = (version:number,network_id:number,chain_id:number,compatible_version:number)=>{
    try{
        if(typeof version!='number'||version<0||!Number.isInteger(version)) throw new Error('invalid version');
        else if(typeof network_id!='number'||network_id<0||!Number.isInteger(network_id)) throw new Error('invalid network id');
        else if(typeof chain_id!='number'||chain_id<0||!Number.isInteger(chain_id)) throw new Error('invalid chain id');
        else if(typeof compatible_version!='number'||compatible_version<0||!Number.isInteger(compatible_version)) throw new Error('invalid compatible version');
        const config:Config = {
            my_version:version,
            my_net_id:network_id,
            my_chain_id:chain_id,
            compatible_version:compatible_version
        }
        change_config(config);
    }
    catch(e){
        throw new Error(e);
    }
}

export const con = {
    constant:constant,
    change_configs:change_configs
}

export const trie = Trie;

const isState = (state:T.State):state is T.State =>{
    return ['state','info'].indexOf(state.kind)!=-1 && typeof state.nonce==='number' && state.nonce>=0 && Number.isInteger(state.nonce) && typeof state.token==='string' && Buffer.from(state.token).length<=constant.token_name_maxsize && typeof state.owner==='string' && !_.address_form_check(state.owner,constant.token_name_maxsize) && typeof state.amount==='number' && state.amount>=0 && !Object.values(state.data).some(val=>typeof val!='string') && typeof state.issued==='number' && state.issued>=0 && typeof state.code==='string' && !_.hash_size_check(state.code);
}

const isLock = (lock:T.Lock):lock is T.Lock =>{
    return typeof lock.address==='string' && !_.address_form_check(lock.address,constant.token_name_maxsize) && ['yet','already'].indexOf(lock.state)!=-1 && typeof lock.height==='number' && lock.height>=0 && Number.isInteger(lock.height) && typeof lock.block_hash==='string' && !_.hash_size_check(lock.block_hash) && typeof lock.index==='number' && lock.index>=0 && Number.isInteger(lock.index) && typeof lock.tx_hash==='string' && !_.hash_size_check(lock.tx_hash);
}

const create_state = (nonce:number=0,owner:string=CryptoSet.GenereateAddress("",_.toHash("")),token:string="",amount:number=0,data:{[key:string]:string}={})=>{
    try{
        if(typeof nonce != 'number' || nonce<0 || !Number.isInteger(nonce)) throw new Error('invalid nonce');
        else if(typeof owner != 'string' || _.address_form_check(owner,constant.token_name_maxsize)) throw new Error('invalid owner');
        else if(typeof token !='string' || Buffer.from(token).length>constant.token_name_maxsize) throw new Error('invalid token');
        else if(typeof amount!= 'number' || amount<0) throw new Error('invalid amount');
        else if(Object.values(data).some(val=>typeof val!='string')) throw new Error('invalid data');
        const state = StateSet.CreateState(nonce,owner,token,amount,data);
        if(!isState(state)) throw new Error('invalid state');
        return state;
    }
    catch(e){
        throw new Error(e);
    }
}

const create_info = (nonce=0,token="",issued=0,code=_.toHash(''))=>{
    try{
        if(typeof nonce != 'number' || nonce<0 || !Number.isInteger(nonce)) throw new Error('invalid nonce');
        else if(typeof token !='string' || Buffer.from(token).length>constant.token_name_maxsize) throw new Error('invalid token');
        else if(typeof issued!='number' || issued<0) throw new Error('invalid issued');
        else if(typeof code!='string' || _.hash_size_check(code)) throw new Error('invalid code');
        const info = StateSet.CreateInfo(nonce,token,issued,code);
        if(!isState(info)) throw new Error('invalid info');
        return info;
    }
    catch(e){
        throw new Error(e);
    }
}

export const state = {
    isState:isState,
    isLock:isLock,
    create_state:create_state,
    create_info:create_info
}


const isTxMeta = (meta:T.TxMeta):meta is T.TxMeta =>{
    return ['request','refresh'].indexOf(meta.type)!=-1 && ['change','create'].indexOf(meta.kind)!=-1 && typeof meta.version==='number' && typeof meta.network_id==='number' && typeof meta.chain_id==='number' && typeof meta.timestamp==='number' && typeof meta.address==='string' && !meta.pub_key.some(pub=>typeof pub!='string') && typeof meta.feeprice==='number' && meta.feeprice>=0 && typeof meta.gas==='number' && meta.gas>=0 && !meta.tokens.some((t,i)=>typeof t!='string'||Buffer.from(t).length>constant.token_name_maxsize||i>=5) && !meta.bases.some(base=>typeof base!='string'||_.address_form_check(base,constant.token_name_maxsize)) && typeof meta.input==='string' && !_.hash_size_check(meta.input) && typeof meta.height==='number' && meta.height>=0 && Number.isInteger(meta.height) && typeof meta.block_hash==='string' && !_.hash_size_check(meta.block_hash) && typeof meta.index==='number' && meta.index>=0 && Number.isInteger(meta.index) && typeof meta.req_tx_hash==='string' && !_.hash_size_check(meta.req_tx_hash) && typeof meta.success==='boolean' && typeof meta.output==='string' && !_.hash_size_check(meta.output) && typeof meta.nonce==='number' && meta.nonce>=0 && Number.isInteger(meta.nonce) && typeof meta.unit_price==='number' && meta.unit_price>=0 && typeof meta.log_hash==='string' && !_.hash_size_check(meta.log_hash);
}

const isTxRaw = (raw:T.TxRaw):raw is T.TxRaw =>{
    return !raw.raw.some(raw=>raw==null||typeof raw!='string') && !raw.signature.some(sign=>sign==null||typeof sign!='string') && raw.log!=null && typeof raw.log==='string';
}

const isTxAdd = (add:T.TxAdd):add is T.TxAdd =>{
    return typeof add.height==='number' && add.height>=0 && Number.isInteger(add.height) && typeof add.hash==='string' && !_.hash_size_check(add.hash) && typeof add.index==='number' && add.index>=0 && Number.isInteger(add.index);
}

const isTx = (tx:T.Tx):tx is T.Tx =>{
    return typeof tx.hash==='string' && !_.hash_size_check(tx.hash) && isTxMeta(tx.meta) && isTxRaw(tx.raw) && isTxAdd(tx.additional);
}

const isTxPure = (tx:T.TxPure):tx is T.TxPure =>{
    return typeof tx.hash==='string' && !_.hash_size_check(tx.hash) && isTxMeta(tx.meta) && isTxAdd(tx.additional);
}

const isBlockMeta = (meta:T.BlockMeta):meta is T.BlockMeta =>{
    return ['key','micro'].indexOf(meta.kind)!=-1 && typeof meta.version==='number' && typeof meta.network_id==='number' && typeof meta.chain_id==='number' && typeof meta.validator==='string' && typeof meta.height==='number' && meta.height>=0 && Number.isInteger(meta.height) && typeof meta.timestamp==='number' && typeof meta.previoushash==='string' && !_.hash_size_check(meta.previoushash) && typeof meta.pos_diff==='number' && meta.pos_diff>0 && !meta.validatorPub.some(pub=>typeof pub!='string') && typeof meta.stateroot==='string' && typeof meta.lockroot==='string' && typeof meta.tx_root==='string' && !_.hash_size_check(meta.tx_root) && typeof meta.fee_sum==='number' && meta.fee_sum>0 && typeof meta.extra==='string';
}

const isBlock = (block:T.Block):block is T.Block =>{
    return typeof block.hash==='string' && !_.hash_size_check(block.hash) && isBlockMeta(block.meta) && !block.txs.some(tx=>!isTxPure(tx)) && !block.raws.some(raw=>!isTxRaw(raw)) && !block.validatorSign.some(sign=>typeof sign!='string');
}

const tx2pure = (tx:T.Tx)=>{
    try{
        if(!isTx(tx)) throw new Error('this is not tx');
        const pure = TxSet.tx_to_pure(tx);
        if(!isTxPure(pure)) throw new Error('this is not tx pure');
        return pure;
    }
    catch(e){
        throw new Error(e);
    }
}

const pure2tx = (pure:T.TxPure,block:T.Block)=>{
    try{
        if(!isTxPure(pure)) throw new Error('invalid tx pure');
        else if(!isBlock(block)) throw new Error('invalid block');
        const tx = TxSet.pure_to_tx(pure,block);
        if(!isTx(tx)) throw new Error('invalid tx');
        return tx;
    }
    catch(e){
        throw new Error(e);
    }
}

const get_tx_fee = (tx:T.Tx)=>{
    try{
        if(!isTx(tx)) throw new Error('this is not tx');
        return TxSet.tx_fee(tx);
    }
    catch(e){
        throw new Error(e);
    }
}

const mining = (request:string,height:number,block_hash:string,refresher:string,output:string,unit_price:number,nonce:number)=>{
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
}

const find_req_tx = (ref_tx:T.Tx,chain:T.Block[])=>{
    try{
        if(!isTx(ref_tx)||ref_tx.meta.kind!='refresh') throw new Error('invalid refresh tx');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        const req_tx = TxSet.find_req_tx(ref_tx,chain);
        if(!isTx(req_tx)||req_tx.meta.kind!='request') throw new Error('invalid request tx');
        return req_tx;
    }
    catch(e){
        throw new Error(e);
    }
}

const verify_req_tx = (req_tx:T.Tx,request_mode:boolean,StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isTx(req_tx)||req_tx.meta.kind!='request') throw new Error('invalid req_tx');
        else if(typeof request_mode!='boolean') throw new Error('invalid request mode');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        return TxSet.ValidRequestTx(req_tx,request_mode,StateData,LockData);
    }
    catch(e){
        throw new Error(e);
    }
}

const verify_ref_tx = (ref_tx:T.Tx,chain:T.Block[],refresh_mode:boolean,StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isTx(ref_tx)||ref_tx.meta.kind!='refresh') throw new Error('invalid ref_tx');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(typeof refresh_mode!='boolean') throw new Error('invalid refresh mode');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        return TxSet.ValidRefreshTx(ref_tx,chain,refresh_mode,StateData,LockData);
    }
    catch(e){
        throw new Error(e);
    }
}

const create_req_tx = (pub_keys:string[],type:T.TxType,tokens:string[],bases:string[],feeprice:number,gas:number,input_raw:string[],log:string)=>{
    try{
        if(pub_keys.some(key=>typeof key!='string')) throw new Error('invalid public keys');
        else if(["change","create"].indexOf(type)===-1) throw new Error('invalid type');
        else if(tokens.some((t,i)=>typeof t!='string'||Buffer.from(t).length>constant.token_name_maxsize||i>=5)) throw new Error('invalid tokens');
        else if(bases.some(b=>typeof b!='string'||_.address_form_check(b,constant.token_name_maxsize))) throw new Error('invalid bases');
        else if(typeof feeprice!='number'||feeprice<0) throw new Error('invalid feeprice');
        else if(typeof gas!='number'||gas<0) throw new Error('invalid gas');
        else if(input_raw.some(raw=>typeof raw!='string')) throw new Error('invalid input_raw');
        else if(typeof log!='string'||_.hash_size_check(log)) throw new Error('invalid log');
        const req_tx = TxSet.CreateRequestTx(pub_keys,type,tokens,bases,feeprice,gas,input_raw,log);
        if(!isTx(req_tx)||req_tx.meta.kind!='request') throw new Error('invalid req_tx');
        return req_tx;
    }
    catch(e){
        throw new Error(e);
    }
}

const create_ref_tx = (pub_keys:string[],feeprice:number,unit_price:number,height:number,block_hash:string,index:number,req_tx_hash:string,success:boolean,nonce:number,output_raw:string[],log_raw:string,chain:T.Block[])=>{
    try{
        if(pub_keys.some(key=>typeof key!='string')) throw new Error('invalid public keys');
        else if(typeof feeprice!='number'||feeprice<0) throw new Error('invalid feeprice');
        else if(typeof unit_price!='number'||unit_price<0) throw new Error('invalid unit price');
        else if(typeof height!='number'||height<0||!Number.isInteger(height)) throw new Error('invalid height');
        else if(typeof block_hash!='string'||_.hash_size_check(block_hash)) throw new Error('invalid block hash');
        else if(typeof index!='number'||index<0||!Number.isInteger(index)) throw new Error('invalid index');
        else if(typeof req_tx_hash!='string'||_.hash_size_check(req_tx_hash)) throw new Error('invalid req tx');
        else if(typeof success!='boolean') throw new Error('invalid success');
        else if(typeof nonce!='number'||nonce<0||!Number.isInteger(nonce)) throw new Error('invalid nonce');
        else if(output_raw.some(raw=>typeof raw!='string')) throw new Error('invalid output raw');
        else if(typeof log_raw!='string') throw new Error('invalid log raw');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        const ref_tx = TxSet.CreateRefreshTx(pub_keys,feeprice,unit_price,height,block_hash,index,req_tx_hash,success,nonce,output_raw,log_raw,chain);
        if(!isTx(ref_tx)) throw new Error('invalid ref_tx');
        return ref_tx;
    }
    catch(e){
        throw new Error(e);
    }
}

const sign_tx = (tx:T.Tx,private_key:string,public_key:string)=>{
    try{
        if(!isTx(tx)) throw new Error('invalid tx');
        else if(typeof private_key!='string') throw new Error('invalid private key');
        else if(typeof public_key!='string') throw new Error('invalid public key');
        const signed = TxSet.SignTx(tx,private_key,public_key);
        if(!isTx(signed)) throw new Error('invalid signed tx');
        return signed;
    }
    catch(e){
        throw new Error(e);
    }
}

const accept_req_tx = (req_tx:T.Tx,height:number,block_hash:string,index:number,StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isTx(req_tx)||req_tx.meta.kind!='request') throw new Error('invalid req_tx');
        else if(typeof height!='number'||height<0||!Number.isInteger(height)) throw new Error('invalid height');
        else if(typeof block_hash!='string'||_.hash_size_check(block_hash)) throw new Error('invalid block hash');
        else if(typeof index!='number'||index<0||!Number.isInteger(index)) throw new Error('invalid index');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        const accepted = TxSet.AcceptRequestTx(req_tx,height,block_hash,index,StateData,LockData);
        if(accepted[0].map(s=>!isState(s))) throw new Error('invalid accepted state data');
        else if(accepted[1].map(l=>!isLock(l))) throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch(e){
        throw new Error(e);
    }
}

const accept_ref_tx = (ref_tx:T.Tx,chain:T.Block[],StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isTx(ref_tx)||ref_tx.meta.kind!='refresh') throw new Error('invalid ref_tx');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        const accepted = TxSet.AcceptRefreshTx(ref_tx,chain,StateData,LockData);
        if(accepted[0].map(s=>!isState(s))) throw new Error('invalid accepted state data');
        else if(accepted[1].map(l=>!isLock(l))) throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch(e){
        throw new Error(e);
    }
}

export const tx = {
    empty_tx:TxSet.empty_tx(),
    isTx:isTx,
    isTxPure:isTxPure,
    isTxMeta:isTxMeta,
    isTxRaw:isTxRaw,
    isTxAdd:isTxAdd,
    tx2pure:tx2pure,
    pure2tx:pure2tx,
    get_tx_fee:get_tx_fee,
    mining:mining,
    find_req_tx:find_req_tx,
    verify_req_tx:verify_req_tx,
    verify_ref_tx:verify_ref_tx,
    create_req_tx:create_req_tx,
    create_ref_tx:create_ref_tx,
    sign_tx:sign_tx,
    accept_req_tx:accept_req_tx,
    accept_ref_tx:accept_ref_tx
}

const search_key_block = (chain:T.Block[])=>{
    try{
        if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        const key_block = BlockSet.search_key_block(chain);
        if(!isBlock(key_block)||key_block.meta.kind!='key') throw new Error('invalid key block');
        return key_block;
    }
    catch(e){
        throw new Error(e);
    }
}

const search_micro_block = (chain:T.Block[],key_block:T.Block)=>{
    try{
        if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(!isBlock(key_block)||key_block.meta.kind!='key') throw new Error('invalid key block');
        const micro_blocks = BlockSet.search_micro_block(chain,key_block);
        if(micro_blocks.some(b=>!isBlock(b)||b.meta.kind!='micro')) throw new Error('invalid micro blocks');
        return micro_blocks;
    }
    catch(e){
        throw new Error(e);
    }
}

const get_tree_root = (hashes:string[])=>{
    try{
        if(hashes.some(hash=>typeof hash!='string'||_.hash_size_check(hash))) throw new Error('hashes');
        const root = BlockSet.GetTreeroot(hashes)[0];
        if(typeof root!='string'||_.hash_size_check(root)) throw new Error('invalid root');
        return root;
    }
    catch(e){
        throw new Error(e);
    }
}

const pos_staking = (previoushash:string,timestamp:number,address:string,balance:number,difficulty:number)=>{
    try{
        if(typeof previoushash!='string'||_.hash_size_check(previoushash)) throw new Error('invalid previoushash');
        else if(typeof timestamp!='number'||timestamp<0) throw new Error('invalid timestamp');
        else if(typeof address!='string'||_.address_form_check(address,constant.token_name_maxsize)) throw new Error('invalid address');
        else if(typeof balance!='number'||balance<0) throw new Error('invalid balance');
        else if(typeof difficulty!='number'||difficulty<0) throw new Error('invalid difficulty');
        return math.chain(2**256).multiply(balance).divide(difficulty).largerEq(BlockSet.pos_hash(previoushash,address,timestamp)).done() as boolean;
    }
    catch(e){
        throw new Error(e);
    }
}

const verify_key_block = (key_block:T.Block,chain:T.Block[],right_stateroot:string,right_lockroot:string,StateData:T.State[])=>{
    try{
        if(!isBlock(key_block)||key_block.meta.kind!='key') throw new Error('invalid block');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(typeof right_stateroot!='string') throw new Error('invalid stateroot');
        else if(typeof right_lockroot!='string') throw new Error('invalid lockroot');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        return BlockSet.ValidKeyBlock(key_block,chain,right_stateroot,right_lockroot,StateData);
    }
    catch(e){
        throw new Error(e);
    }
}

const verify_micro_block = (micro_block:T.Block,chain:T.Block[],right_stateroot:string,right_lockroot:string,StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isBlock(micro_block)||micro_block.meta.kind!='micro') throw new Error('invalid block');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(typeof right_stateroot!='string') throw new Error('invalid stateroot');
        else if(typeof right_lockroot!='string') throw new Error('invalid lockroot');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        return BlockSet.ValidMicroBlock(micro_block,chain,right_stateroot,right_lockroot,StateData,LockData);
    }
    catch(e){
        throw new Error(e);
    }
}

const create_key_block = (chain:T.Block[],validatorPub:string[],stateroot:string,lockroot:string,extra:string)=>{
    try{
        if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(validatorPub.some(pub=>typeof pub!='string')) throw new Error('invalid validator public keys');
        else if(typeof stateroot!='string') throw new Error('invalid stateroot');
        else if(typeof lockroot!='string') throw new Error('invalid lockroot');
        else if(typeof extra!='string') throw new Error('invalid extra');
        const key_block = BlockSet.CreateKeyBlock(chain,validatorPub,stateroot,lockroot,extra);
        if(!isBlock(key_block)||key_block.meta.kind!='key') throw new Error('invalid block');
        return key_block;
    }
    catch(e){
        throw new Error(e);
    }
}

const create_micro_block = (chain:T.Block[],stateroot:string,lockroot:string,txs:T.Tx[],extra:string)=>{
    try{
        if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(typeof stateroot!='string') throw new Error('invalid stateroot');
        else if(typeof lockroot!='string') throw new Error('invalid lockroot');
        else if(txs.some(tx=>!isTx(tx))) throw new Error('invalid txs');
        else if(typeof extra!='string') throw new Error('invalid extra');
        const micro_block = BlockSet.CreateMicroBlock(chain,stateroot,lockroot,txs,extra);
        if(!isBlock(micro_block)||micro_block.meta.kind!='micro') throw new Error('invalid block');
        return micro_block;
    }
    catch(e){
        throw new Error(e);
    }
}

const sign_block = (block:T.Block,private_key:string,public_key:string)=>{
    try{
        if(!isBlock(block)) throw new Error('invalid block');
        else if(typeof private_key!='string') throw new Error('invalid private key');
        else if(typeof public_key!='string') throw new Error('invalid public key');
        const signed = BlockSet.SignBlock(block,private_key,public_key);
        if(!isBlock(signed)) throw new Error('invalid signed block');
        return signed;
    }
    catch(e){
        throw new Error(e);
    }
}

const accept_key_block = (key_block:T.Block,chain:T.Block[],StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isBlock(key_block)||key_block.meta.kind!='key') throw new Error('invalid block');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        const accepted = BlockSet.AcceptKeyBlock(key_block,chain,StateData,LockData);
        if(accepted[0].some(s=>!isState(s))) throw new Error('invalid accepted state data');
        else if(accepted[1].some(l=>!isLock(l))) throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch(e){
        throw new Error(e);
    }
}

const accept_micro_block = (micro_block:T.Block,chain:T.Block[],StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isBlock(micro_block)||micro_block.meta.kind!='key') throw new Error('invalid block');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        const accepted = BlockSet.AcceptKeyBlock(micro_block,chain,StateData,LockData);
        if(accepted[0].some(s=>!isState(s))) throw new Error('invalid accepted state data');
        else if(accepted[1].some(l=>!isLock(l))) throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch(e){
        throw new Error(e);
    }
}

export const block = {
    isBlock:isBlock,
    isBlockMeta:isBlockMeta,
    empty_block:BlockSet.empty_block(),
    search_key_block:search_key_block,
    search_micro_block:search_micro_block,
    get_tree_root:get_tree_root,
    pos_staking:pos_staking,
    verify_key_block:verify_key_block,
    verify_micro_block:verify_micro_block,
    create_key_block:create_key_block,
    create_micro_block:create_micro_block,
    sign_block:sign_block,
    accept_key_block:accept_key_block,
    accept_micro_block:accept_micro_block
}

const isPool = (pool:T.Pool):pool is T.Pool=>{
    return !Object.values(pool).some(tx=>!isTx(tx));
}

const tx2pool = (pool:T.Pool,tx:T.Tx,chain:T.Block[],StateData:T.State[],LockData:T.Lock[])=>{
    try{
        if(!isPool(pool)) throw new Error('invalid pool');
        else if(!isTx(tx)) throw new Error('invalid tx');
        else if(chain.some(b=>!isBlock(b))) throw new Error('invalid chain');
        else if(StateData.some(s=>!isState(s))) throw new Error('invalid state data');
        else if(LockData.some(l=>!isLock(l))) throw new Error('invalid lock data');
        const new_pool = PoolSet.Tx_to_Pool(pool,tx,chain,StateData,LockData);
        if(!isPool(new_pool)) throw new Error('invalid new pool');
        return new_pool;
    }
    catch(e){
        throw new Error(e);
    }
}

export const pool = {
    isPool:isPool,
    tx2pool:tx2pool
}

