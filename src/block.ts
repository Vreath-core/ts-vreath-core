import * as _ from './util'
import * as crypto_set from './crypto_set'
import * as T from './types'
import * as state_set from './state'
import * as lock_set from './lock'
import * as tx_set from './tx'
import {get_diff} from './diff'
import { Trie } from './merkle_patricia';
import {DB} from './db';
import * as data from './data'
import { constant } from './constant';
import * as contract from './contract'
import bigInt, { BigInteger } from 'big-integer'
import * as P from 'p-iteration'


export const empty_block = ():T.Block=>{
    const meta:T.BlockMeta = {
        kind:0,
        height:"",
        previoushash:"",
        timestamp:0,
        pos_diff:"",
        trie_root:"",
        tx_root:"",
        fee_sum:"",
        extra:""
    }
    const hash = ""
    const sign:T.Sign= {
        data:"",
        v:""
    }
    return {
        hash:hash,
        signature:sign,
        meta:meta,
        txs:[],
    }
}

export const block_meta2array = (meta:T.BlockMeta):string[]=>{
    const kind = "0"+meta.kind.toString(16);
    return [kind,meta.height,meta.previoushash,meta.timestamp.toString(16),meta.pos_diff,meta.trie_root,meta.tx_root,meta.extra];
}

export const get_info_from_block = (block:T.Block):[string,string[],string,string,string]=>{
    const sign = block.signature;
    const meta_data = block_meta2array(block.meta);
    const recover_id = bigInt(sign.v,16).mod(2).toJSNumber();
    const id = _.bigInt2hex(bigInt(bigInt(sign.v,16).minus(9).minus(28-recover_id)).divide(2));
    const raw_array = meta_data.concat(id);
    const meta_hash = _.array2hash(raw_array);
    const public_key = crypto_set.recover(meta_hash,sign.data,recover_id);
    const address = crypto_set.generate_address(constant.native,public_key);
    const all_array = raw_array.concat(sign.v);
    return [meta_hash,all_array,id,public_key,address]
}

export const search_key_block = async (block_db:DB,last_height:string)=>{
    let height:string = last_height;
    let block:T.Block|null = empty_block();
    while(1){
        block = await block_db.read_obj(height);
        if(block==null) continue;
        if(block.meta.kind===0) break;
        else if(height==="00") break;
        else{
            height = _.bigInt2hex(bigInt(height,16).subtract(1));
        }
    }
    return block;
}

export const search_micro_block = async (block_db:DB,key_block:T.Block,last_height:string)=>{
    const raw_block_hash = _.array2hash(block_meta2array(key_block.meta));
    const recover_id = bigInt(key_block.signature.v,16).mod(2).toJSNumber();
    const key_public = crypto_set.recover(raw_block_hash,key_block.signature.data,recover_id);
    let height = key_block.meta.height;
    let block:T.Block | null;
    let raw_hash:string;
    let public_key:string;
    let micros:T.Block[] = [];
    while(1){
        block = await block_db.read_obj(height);
        if(block==null) continue;
        raw_hash = _.array2hash(block_meta2array(block.meta));
        public_key = crypto_set.recover(raw_hash,block.signature.data,bigInt(block.signature.v,16).mod(2).toJSNumber());
        if(block.meta.kind===1&&public_key===key_public) micros.push(block);
        if(height===last_height) break;
        height = _.bigInt2hex(bigInt(height,16).add(1));
    }
    return micros;
}

export const GetTreeroot = (pre:string[]):string[]=>{
    if(pre.length==0) return [crypto_set.get_sha256("")];
    else if(pre.length==1) return pre;
    else{
    const union = pre.reduce((result:string[],val:string,index:number,array:string[]):string[]=>{
      const i = Number(index);
      if(i%2==0){
        const left = val;
        const right = ((left:string,i:number,array:string[])=>{
          if(array[i+1]==null) return crypto_set.get_sha256("");
          else return array[i+1];
        })(left,i,array);
        return result.concat(crypto_set.get_sha256(left+right));
      }
      else return result;
    },[]);
    return GetTreeroot(union);
    }
}

export const tx_fee_sum = (txs:T.Tx[]):string=>{
    const sum = txs.reduce((sum,tx)=>sum.add(bigInt(tx_set.tx_fee(tx),16)),bigInt(0));
    return _.bigInt2hex(sum)
};

export const pos_hash = (previoushash:string,address:string,timestamp:number)=>{
    return _.array2hash([previoushash,address,timestamp.toString(16)]);
}

/*const PoS_mining = (previoushash:string,address:string,balance:number,difficulty:number)=>{
    let date;
    let timestamp
    let i=0;
    do {
      date = new Date();
      timestamp = date.getTime();
      i++;
      if(i>1000) break;
    } while (math.chain(2**256).multiply(balance).divide(difficulty).smaller(pos_hash(previoushash,address,timestamp)));
    return timestamp;
}*/

/*export const Wait_block_time = (pre:number,block_time:number)=>{
    let date;
    let timestamp;
    do{
        date = new Date();
        timestamp = date.getTime();
    } while(math.chain(timestamp).subtract(pre).smaller(block_time))
    return timestamp;
}*/

export const txs_check = async (block:T.Block,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
    const txs = block.txs;
    const all_bases = txs.reduce((res:string[],tx)=>{
        const address = tx_set.get_info_from_tx(tx)[4];
        return res.concat(address).concat(tx.meta.request.bases);
    },[]);
    if(all_bases.some((val,i,array)=>array.indexOf(val)!=i)) return true;
    return await P.some(txs,async (tx:T.Tx)=>{
        if(tx.meta.kind===0){
            return await tx_set.verify_req_tx(tx,trie,state_db,lock_db)===false;
        }
        else if(tx.meta.kind===1){
            return await tx_set.verify_ref_tx(tx,output_states,block_db,trie,state_db,lock_db,last_height)===false;
        }
        else return true;
    });
}

export const compute_block_size = (block:T.Block)=>{
    const meta_array = block_meta2array(block.meta);
    const signs = [block.signature.data,block.signature.v];
    const txs = block.txs.reduce((res:string[],tx)=>{
        const meta = tx.meta;
        const sign = tx.signature.map(s=>s.data+s.v);
        const array = tx_set.tx_meta2array(meta).concat(tx.hash).concat(sign);
        return res.concat(array);
    },[]);
    const all_array = meta_array.concat(block.hash).concat(signs).concat(txs);
    const tx_fee_sum = _.bigInt2hex(all_array.reduce((sum,item)=>sum.add(Math.ceil(Buffer.from(item,'hex').length)),bigInt(0)));
    return tx_fee_sum;
}

export const verify_key_block = async (block:T.Block,block_db:DB,trie:Trie,state_db:DB,last_height:string)=>{
    const hash = block.hash;
    const sign = block.signature;
    const meta = block.meta;
    const kind = meta.kind;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const trie_root = meta.trie_root;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;

    const info = get_info_from_block(block);
    const meta_hash = info[0];
    const all_array = info[1];
    const id = info[2];
    const validator_pub = info[3];
    const unit_validator = crypto_set.generate_address(constant.unit,validator_pub);

    const unit_validator_state:T.State = await data.read_from_trie(trie,state_db,unit_validator,0,state_set.CreateState("00",unit_validator,constant.unit,"00",["01","00"]));
    const pre_height = unit_validator_state.data[1];
    const reduce = bigInt(last_height,16).subtract(bigInt(pre_height,16));
    const reduced_amount = (()=>{
        const computed = bigInt(unit_validator_state.amount,16).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
        if(computed.lesser(1)) return _.bigInt2hex(bigInt("00"));
        else return _.bigInt2hex(computed);
    })();
    const right_diff = get_diff(reduced_amount);
    const hash_for_pos = pos_hash(previoushash,unit_validator,timestamp);

    const last:T.Block = await block_db.read_obj(last_height) || empty_block();
    const right_previoushash = last.hash;

    const right_trie_root = trie.now_root();


    if(hash!=_.array2hash(all_array)||!bigInt(hash_for_pos,16).lesserOrEquals(bigInt(2).pow(256).multiply(bigInt(reduced_amount,16)).divide(bigInt(right_diff,16)))){
        //console.log("invalid hash");
        return false;
    }
    else if(_.sign_check(meta_hash,sign.data,validator_pub)){
        //console.log("invalid validator signature");
        return false;
    }
    else if(kind!=0){
        //console.log("invalid kind");
        return false;
    }
    else if(bigInt(id.slice(0,4),16).lesser(constant.my_version)){
        //console.log("invalid version");
        return false;
    }
    else if(id.slice(4,8)!=constant.my_chain_id){
        //console.log("invalid chain id");
        return false;
    }
    else if(id.slice(8,12)!=constant.my_net_id){
        //console.log("invalid network id");
        return false;
    }
    else if(bigInt(height,16).notEquals(bigInt(last_height,16).add(1))){
        //console.log("invalid height");
        return false;
    }
    else if(previoushash!=right_previoushash){
        //console.log("invalid parenthash");
        return false;
    }
    else if(timestamp.toString().length!=10||_.time_check(timestamp)){
        //console.log("invalid timestamp");
        return false;
    }
    else if(pos_diff!=right_diff){
        //console.log("invalid pos_diff");
        return false;
    }
    else if(trie_root!=right_trie_root){
        //console.log("invalid trie_root");
        return false;
    }
    else if(tx_root!=crypto_set.get_sha256("")){
        //console.log("invalid tx_root");
        return false;
    }
    else if(fee_sum!="00"){
        //console.log("invalid fee_sum");
        return false;
    }
    else if(txs.length>0){
        //console.log("invalid txs");
        return false;
    }
    else if(!bigInt(compute_block_size(block),16).lesserOrEquals(constant.block_size)){
        //console.log("too big block");
        return false;
    }
    else{
        return true;
    }
}

export const verify_micro_block = async (block:T.Block,output_states:T.State[],block_db:DB,trie:Trie,state_db:DB,lock_db:DB,last_height:string)=>{
    const hash = block.hash;
    const sign = block.signature;
    const meta = block.meta;
    const kind = meta.kind;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const trie_root = meta.trie_root;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;

    const info = get_info_from_block(block);
    const meta_hash = info[0];
    const all_array = info[1];
    const id = info[2];
    const validator_pub = info[3];

    const tx_roots = txs.map(t=>t.hash);

    const date = new Date();
    const now = Math.floor(date.getTime()/1000);

    const key_block = await search_key_block(block_db,last_height) || empty_block();
    const key_block_public = get_info_from_block(key_block)[3];
    const already_micro = await search_micro_block(block_db,key_block,last_height);

    const last:T.Block = await block_db.read_obj(last_height) || empty_block();
    const right_previoushash = last.hash;

    const right_trie_root = trie.now_root();

    const tx_tokens = txs.map(tx=>{
        const sliced = tx.meta.request.bases.map(key=>_.slice_token_part(key));
        return sliced.filter((val,i,array)=>array.indexOf(val)===i);
    })

    if(hash!=_.array2hash(all_array)){
        //console.log("invalid hash");
        return false;
    }
    else if(validator_pub!=key_block_public){
        //console.log("invalid validator");
        return false;
    }
    else if(_.sign_check(meta_hash,sign.data,validator_pub)){
        //console.log("invalid validator signature");
        return false;
    }
    else if(kind!=0){
        //console.log("invalid kind");
        return false;
    }
    else if(bigInt(id.slice(0,4),16).lesser(constant.my_version)){
        //console.log("invalid version");
        return false;
    }
    else if(id.slice(4,8)!=constant.my_chain_id){
        //console.log("invalid chain id");
        return false;
    }
    else if(id.slice(8,12)!=constant.my_net_id){
        //console.log("invalid network id");
        return false;
    }
    else if(bigInt(height,16).notEquals(bigInt(last_height,16).add(1))){
        //console.log("invalid height");
        return false;
    }
    else if(previoushash!=right_previoushash){
        //console.log("invalid parenthash");
        return false;
    }
    else if(timestamp.toString().length!=10||_.time_check(timestamp)||now-last.meta.timestamp<constant.block_time){
        //console.log("invalid timestamp");
        return false;
    }
    else if(pos_diff!=key_block.meta.pos_diff){
        //console.log("invalid pos_diff");
        return false;
    }
    else if(trie_root!=right_trie_root){
        //console.log("invalid trie_root");
        return false;
    }
    else if(tx_root!=GetTreeroot(tx_roots)[0]){
        //console.log("invalid tx_root");
        return false;
    }
    else if(fee_sum!=tx_fee_sum(txs)){
        //console.log("invalid fee_sum");
        return false;
    }
    else if(!bigInt(compute_block_size(block),16).lesserOrEquals(constant.block_size)){
        //console.log("too big block");
        return false;
    }
    else if(already_micro.length>constant.max_blocks){
        //console.log("too many micro blocks");
        return false;
    }
    else if(txs_check(block,output_states,block_db,trie,state_db,lock_db,last_height)){
        //console.log("invalid txs");
        return false;
    }
    else if((bigInt(height,16).mod(3).eq(0)&&txs.some((tx,i)=>tx.meta.kind===0&&_.array2hash(tx_tokens[i])!=_.array2hash([constant.unit,constant.native])||(bigInt(height,16).mod(3).notEquals(0)&&txs.some((tx,i)=>tx.meta.kind===0&&_.array2hash(tx_tokens[i])===_.array2hash([constant.unit,constant.native])))))){
        //console.log("invalid kind of txs")
        return false;
    }
    else{
        return true;
    }
}

export const create_key_block = async (private_key:string,block_db:DB,last_height:string,trie:Trie,state_db:DB,extra:string):Promise<T.Block>=>{
    const empty = empty_block();
    const last:T.Block = await block_db.read_obj(last_height) || empty;
    const previoushash = last.hash
    const public_key = crypto_set.private2public(private_key);
    const unit_validator = crypto_set.generate_address(constant.unit,public_key);
    const unit_validator_state:T.State = await data.read_from_trie(trie,state_db,unit_validator,0,state_set.CreateState("00",unit_validator,constant.unit,"00",["01","00"]));
    const pre_height = unit_validator_state.data[1];
    const reduce = bigInt(last_height,16).subtract(bigInt(pre_height,16));
    const reduced_amount = (()=>{
        const computed = bigInt(unit_validator_state.amount,16).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
        if(computed.lesser(1)) return _.bigInt2hex(bigInt("00"));
        else return _.bigInt2hex(computed);
    })();
    const pos_diff = get_diff(reduced_amount);
    const trie_root = trie.now_root();
    const date = new Date();
    const timestamp = Math.floor(date.getTime()/1000);

    const meta:T.BlockMeta = {
        kind:0,
        height:last_height,
        previoushash:previoushash,
        timestamp:timestamp,
        pos_diff:pos_diff,
        trie_root:trie_root,
        tx_root:crypto_set.get_sha256(''),
        fee_sum:"00",
        extra:extra
    }
    const id = constant.my_version+constant.my_chain_id+constant.my_net_id;
    const meta_array = block_meta2array(meta).concat(id);
    const meta_hash = _.array2hash(meta_array);
    const signed = crypto_set.sign(meta_hash,private_key);
    const v = _.bigInt2hex(bigInt(id,16).multiply(2).add(8).add(bigInt(28).subtract(bigInt(signed[0],16))));
    const sign = {
        data:signed[1],
        v:v
    }
    const all_array = meta_array.concat(sign.v);
    const hash = _.array2hash(all_array);
    return {
        hash:hash,
        signature:sign,
        meta:meta,
        txs:[],
    }
}

export const create_micro_block = async (private_key:string,block_db:DB,last_height:string,trie:Trie,txs:T.Tx[],extra:string):Promise<T.Block>=>{
    const empty = empty_block();
    const last:T.Block = await block_db.read_obj(last_height) || empty;
    const previoushash = last.hash;
    const key = await search_key_block(block_db,last_height) || empty_block();
    const date = new Date();
    const timestamp = Math.floor(date.getTime()/1000);
    const trie_root = trie.now_root();
    const tx_root = GetTreeroot(txs.map(t=>t.hash))[0];
    const fee_sum = tx_fee_sum(txs);

    const meta:T.BlockMeta = {
        kind:1,
        height:last_height,
        previoushash:previoushash,
        timestamp:timestamp,
        pos_diff:key.meta.pos_diff,
        trie_root:trie_root,
        tx_root:tx_root,
        fee_sum:fee_sum,
        extra:extra
    }
    const id = constant.my_version+constant.my_chain_id+constant.my_net_id;
    const meta_array = block_meta2array(meta).concat(id);
    const meta_hash = _.array2hash(meta_array);
    const signed = crypto_set.sign(meta_hash,private_key);
    const v = _.bigInt2hex(bigInt(id,16).multiply(2).add(8).add(bigInt(28).subtract(bigInt(signed[0],16))));
    const sign = {
        data:signed[1],
        v:v
    }
    const all_array = meta_array.concat(sign.v);
    const hash = _.array2hash(all_array);
    return {
        hash:hash,
        signature:sign,
        meta:meta,
        txs:txs,
    }
}


const compute_issue = (height:string)=>{
    const all_issue = constant.all_issue;
    const cycle = constant.cycle;
    const n:BigInteger = bigInt(height,16).divide(cycle);
    const new_amount:BigInteger = bigInt(all_issue,16).divide(bigInt(2).pow(n.add(1)));
    const pre_amount:BigInteger = bigInt(all_issue,16).divide(bigInt(2).pow(n));
    const issue:BigInteger = pre_amount.subtract(new_amount).divide(cycle);
    if(issue.lesser(1)) return "00";
    else return _.bigInt2hex(issue);
}

export const accept_key_block = async (block:T.Block,block_db:DB,last_height:string,trie:Trie,state_db:DB,lock_db:DB)=>{
    const last_key = await search_key_block(block_db,last_height) || empty_block();
    const last_micros = await search_micro_block(block_db,last_key,last_height);

    const pre_pulled = get_info_from_block(last_key);
    const new_pulled = get_info_from_block(block);
    const pre_native = pre_pulled[4];
    const new_native = new_pulled[4];
    const pre_unit = crypto_set.generate_address(constant.unit,pre_pulled[3]);
    const new_unit = crypto_set.generate_address(constant.unit,new_pulled[3]);
    const tx_bases = last_micros.reduce((res:string[],block)=>{
        return res.concat(block.txs.map(tx=>{
            return tx_set.get_info_from_tx(tx)[4];
        }));
    },[]);
    const bases = tx_bases.concat(pre_native).concat(new_native).concat(pre_unit).concat(new_unit).filter((val,i,array)=>array.indexOf(val)===i);
    const base_states = await P.map(bases, async key=>{
        return await data.read_from_trie(trie,state_db,key,0,state_set.CreateState("00",_.slice_token_part(key),key));
    });

    const fees = last_micros.reduce((sum,b)=>bigInt(sum).add(b.meta.fee_sum),bigInt(0));
    const issues = last_micros.concat(last_key).reduce((sum,b)=>sum.add(bigInt(compute_issue(b.meta.height),16)),bigInt(0));
    const fee_sum = _.bigInt2hex(fees.add(issues));
    const changed =contract.key_block_change(base_states,pre_native,new_native,fee_sum,last_height);
    const lock_states = await P.map(bases, async key=>{
        return await data.read_from_trie(trie,lock_db,key,1,lock_set.CreateLock(key));
    });
    await P.forEach(bases, async (key,i)=>{
        await data.write_trie(trie,state_db,lock_db,changed[i],lock_states[i]);
    });
}

export const accept_micro_block = async (block:T.Block,block_db:DB,last_height:string,trie:Trie,state_db:DB,lock_db:DB)=>{
    await P.forEach(block.txs, async (tx,i)=>{
        if(tx.meta.kind===0) await tx_set.accept_req_tx(tx,last_height,block.hash,i,trie,state_db,lock_db);
        else if(tx.meta.kind===1) await tx_set.accept_ref_tx(tx,last_height,block.hash,i,trie,state_db,lock_db,block_db);
    });
    const public_key = get_info_from_block(block)[3];
    const unit_validator = crypto_set.generate_address(constant.unit,public_key);
    const unit_state = await data.read_from_trie(trie,state_db,unit_validator,0,state_set.CreateState("00",constant.unit,unit_validator,"00",["01","00"]));
    const changed = contract.micro_block_change([unit_state],last_height);
    const lock_state = await data.read_from_trie(trie,lock_db,unit_validator,1,lock_set.CreateLock(unit_validator));
    await data.write_trie(trie,state_db,lock_db,changed[0],lock_state);
}