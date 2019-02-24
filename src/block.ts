import * as _ from './basic'
import * as CryptoSet from './crypto_set'
import * as T from './types'
import * as StateSet from './state'
import * as TxSet from './tx'
import {get_diff} from './lwma'
import * as math from 'mathjs'
import { constant } from './con';
math.config({
    number: 'BigNumber'
});

export const empty_block = ():T.Block=>{
    const meta:T.BlockMeta = {
        kind:'key',
        version:0,
        network_id:0,
        chain_id:0,
        validator:'',
        height:0,
        previoushash:'',
        timestamp:0,
        pos_diff:0,
        validatorPub:[],
        stateroot:'',
        lockroot:'',
        tx_root:'',
        fee_sum:0,
        extra:''
    }
    const hash = _.ObjectHash(meta);
    return {
        hash:hash,
        validatorSign:[],
        meta:meta,
        txs:[],
        raws:[]
    }
}

export const search_key_block = (chain:T.Block[])=>{
    let block:T.Block;
    for(block of chain.slice().reverse()){
        if(block.meta.kind==="key") return block;
    }
    return empty_block();
}

export const search_micro_block = (chain:T.Block[],key_block:T.Block):T.Block[]=>{
    return chain.slice(key_block.meta.height).filter((block:T.Block)=>{
        return block.meta.kind==="micro"&&block.meta.validator===key_block.meta.validator;
    });
}

export const GetTreeroot = (pre:string[]):string[]=>{
    if(pre.length==0) return [_.toHash("")];
    else if(pre.length==1) return pre;
    else{
    const union = pre.reduce((result:string[],val:string,index:number,array:string[]):string[]=>{
      const i = Number(index);
      if(i%2==0){
        const left = val;
        const right = ((left:string,i:number,array:string[])=>{
          if(array[i+1]==null) return _.toHash("");
          else return array[i+1];
        })(left,i,array);
        return result.concat(_.toHash(left+right));
      }
      else return result;
    },[]);
    return GetTreeroot(union);
    }
}

const tx_fee_sum = (pure_txs:T.TxPure[],raws:T.TxRaw[]):number=>{
    const txs:T.Tx[] = pure_txs.map((t,i)=>{
        return {
            hash:t.hash,
            meta:t.meta,
            raw:raws[i],
            additional:t.additional
        }
    });
    return txs.reduce((sum,tx)=>math.chain(sum).add(TxSet.tx_fee(tx)).done(),0);
};

export const pos_hash = (previoushash:string,address:string,timestamp:number)=>{
    return _.toHashNum(math.chain(_.Hex_to_Num(previoushash)).add(_.toHashNum(address)).add(timestamp).done().toString());
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

export const txs_check = (block:T.Block,chain:T.Block[],StateData:T.State[],LocationData:T.Lock[])=>{
    const txs = block.txs.map((tx,i):T.Tx=>{
        return {
            hash:tx.hash,
            meta:tx.meta,
            raw:block.raws[i],
            additional:tx.additional
        }
    });

    return txs.some((tx:T.Tx)=>{
        if(tx.meta.kind==="request"){
            return !TxSet.ValidRequestTx(tx,true,StateData,LocationData);
        }
        else if(tx.meta.kind==="refresh"){
            return !TxSet.ValidRefreshTx(tx,chain,true,StateData,LocationData);
        }
        else return true;
    });
}

export const ValidKeyBlock = (block:T.Block,chain:T.Block[],right_stateroot:string,right_lockroot:string,StateData:T.State[])=>{
    const hash = block.hash;
    const sign = block.validatorSign;
    const meta = block.meta;
    const version = meta.version;
    const network_id = meta.network_id;
    const chain_id = meta.chain_id;
    const validator = meta.validator;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const validatorPub = meta.validatorPub;
    const stateroot = meta.stateroot;
    const lockroot = meta.lockroot;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;
    const raws = block.raws;

    const last = chain[chain.length-1] || empty_block();
    const right_previoushash = last.hash;

    const lwma_infos = chain.slice(-1*(constant.lwma_size+1)*(1+constant.max_blocks)).filter(block=>block.meta.kind==='key').reduce((res:{times:number[],cumulative_diffs:number[]},block,i)=>{
        res.times = res.times.concat(block.meta.timestamp);
        res.cumulative_diffs = res.cumulative_diffs.concat(math.chain(res.cumulative_diffs[i-1]||0).add(block.meta.pos_diff).done())
        return res;
    },{times:[],cumulative_diffs:[]});
    const right_diff = get_diff(lwma_infos.cumulative_diffs,constant.block_time*(constant.max_blocks+1),lwma_infos.times);

    const native_validator = CryptoSet.GenerateAddress(constant.native,_.reduce_pub(validatorPub));
    const unit_validator = CryptoSet.GenerateAddress(constant.unit,_.reduce_pub(validatorPub));
    const unit_validator_state:T.State = StateData.filter(s=>s.kind==="state"&&s.owner===unit_validator&&s.token===constant.unit)[0] || StateSet.CreateState(0,unit_validator,constant.unit,0);


    if(_.object_hash_check(hash,meta)||math.chain(2**256).multiply(unit_validator_state.amount).divide(right_diff).smaller(pos_hash(last.hash,unit_validator,timestamp)).done() as boolean){
        //console.log("invalid hash");
        return false;
    }
    else if(validator!=native_validator||unit_validator_state.amount===0){
        //console.log("invalid validator");
        return false;
    }
    else if(sign.length===0||sign.some((s,i)=>_.sign_check(hash,s,validatorPub[i]))){
        //console.log("invalid validator signature");
        return false;
    }
    else if(version!=constant.my_version){
        //console.log("invalid version");
        return false;
    }
    else if(network_id!=constant.my_net_id){
        //console.log("invalid network id");
        return false;
    }
    else if(chain_id!=constant.my_chain_id){
        //console.log("invalid chain id");
        return false;
    }
    else if(height!=chain.length){
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
    else if(stateroot!=right_stateroot){
        //console.log("invalid stateroot");
        return false;
    }
    else if(lockroot!=right_lockroot){
        //console.log("invalid location");
        return false;
    }
    else if(tx_root!=_.toHash("")){
        //console.log("invalid tx_root");
        return false;
    }
    else if(fee_sum!=0){
        //console.log("invalid fee_sum");
        return false;
    }
    else if(txs.length>0){
        //console.log("invalid txs");
        return false;
    }
    else if(raws.length>0){
        //console.log("invalid raws");
        return false;
    }
    else if(math.chain(Buffer.from(_.Object2string(meta)+_.Object2string(block.txs)+_.Object2string(block.raws)+_.Object2string(block.validatorSign)).length).larger(constant.block_size).done() as boolean){
        //console.log("too big block");
        return false;
    }
    else{
        return true;
    }
}

export const ValidMicroBlock = (block:T.Block,chain:T.Block[],right_stateroot:string,right_lockroot:string,StateData:T.State[],LockData:T.Lock[])=>{
    const hash = block.hash;
    const sign = block.validatorSign;
    const meta = block.meta;
    const version = meta.version;
    const network_id = meta.network_id;
    const chain_id = meta.chain_id;
    const validator = meta.validator;
    const height = meta.height;
    const previoushash = meta.previoushash;
    const timestamp = meta.timestamp;
    const pos_diff = meta.pos_diff;
    const stateroot = meta.stateroot;
    const lockroot = meta.lockroot;
    const tx_root = meta.tx_root;
    const fee_sum = meta.fee_sum;
    const txs = block.txs;
    const raws = block.raws;

    const last = chain[chain.length-1] || empty_block();
    const right_previoushash = last.hash
    const key_block = search_key_block(chain);
    const validatorPub = key_block.meta.validatorPub;

    const tx_roots = txs.map(t=>t.hash);

    const date = new Date();
    const now = Math.floor(date.getTime()/1000);

    const already_micro = search_micro_block(chain,key_block);


    if(_.object_hash_check(hash,meta)){
        //console.log("invalid hash");
        return false;
    }
    else if(sign.length===0||sign.some((s,i)=>_.sign_check(hash,s,validatorPub[i]))){
        //console.log("invalid validator signature");
        return false;
    }
    else if(version!=constant.my_version){
        //console.log("invalid version");
        return false;
    }
    else if(network_id!=constant.my_net_id){
        //console.log("invalid network_id");
        return false;
    }
    else if(chain_id!=constant.my_chain_id){
        //console.log("invalid chain id");
        return false;
    }
    else if(validator!=key_block.meta.validator){
        //console.log("invalid validator");
        return false;
    }
    else if(height!=chain.length){
        //console.log("invalid height");
        return false;
    }
    else if(previoushash!=right_previoushash){
        //console.log("invalid parenthash");
        return false;
    }
    else if(last.hash===empty_block().hash||timestamp.toString().length!=10||_.time_check(timestamp)||math.chain(now).subtract(last.meta.timestamp).smaller(constant.block_time).done() as boolean){
        //console.log("invalid timestamp");
        return false;
    }
    else if(pos_diff!=key_block.meta.pos_diff){
        //console.log("invalid pos_diff");
        return false;
    }
    else if(_.ObjectHash(block.meta.validatorPub)!=_.ObjectHash([])){
        //console.log("invalid validator public key");
        return false;
    }
    else if(stateroot!=right_stateroot){
        //console.log("invalid stateroot");
        return false;
    }
    else if(lockroot!=right_lockroot){
        //console.log("invalid location");
        return false;
    }
    else if(tx_root!=GetTreeroot(tx_roots)[0]){
        //console.log("invalid tx_root");
        return false;
    }
    else if(fee_sum!=tx_fee_sum(txs,raws)){
        //console.log("invalid fee_sum");
        return false;
    }
    else if(txs.length!=raws.length){
        //console.log("invalid raws");
        return false;
    }
    else if(math.chain(Buffer.from(_.Object2string(meta)+_.Object2string(block.txs)+_.Object2string(block.raws)+_.Object2string(block.validatorSign)).length).larger(constant.block_size).done() as boolean){
        //console.log("too big block");
        return false;
    }
    else if(already_micro.length>constant.max_blocks){
        //console.log("too many micro blocks");
        return false;
    }
    else if(txs_check(block,chain,StateData,LockData)){
        //console.log("invalid txs");
        return false;
    }
    else if((height%10===0&&txs.some(tx=>tx.meta.kind==='request'&&_.ObjectHash(tx.meta.tokens)!=_.ObjectHash([constant.unit,constant.native])))||(height%10!=0&&txs.some(tx=>tx.meta.kind==='request'&&_.ObjectHash(tx.meta.tokens)===_.ObjectHash([constant.unit,constant.native])))){
        //console.log("invalid kind of txs")
        return false;
    }
    else{
        return true;
    }
}

export const CreateKeyBlock = (chain:T.Block[],validatorPub:string[],stateroot:string,lockroot:string,extra:string):T.Block=>{
    const empty = empty_block();
    const last = chain[chain.length-1] || empty;
    const previoushash = last.hash
    const native_validator = CryptoSet.GenerateAddress(constant.native,_.reduce_pub(validatorPub));

    const lwma_infos = chain.slice(-1*(constant.lwma_size+1)*(1+constant.max_blocks)).filter(block=>block.meta.kind==='key').reduce((res:{times:number[],cumulative_diffs:number[]},block,i)=>{
        res.times = res.times.concat(block.meta.timestamp);
        res.cumulative_diffs = res.cumulative_diffs.concat(math.chain(res.cumulative_diffs[i-1]||0).add(block.meta.pos_diff).done())
        return res;
    },{times:[],cumulative_diffs:[]});
    const pos_diff = get_diff(lwma_infos.cumulative_diffs,constant.block_time*(constant.max_blocks+1),lwma_infos.times);
    const date = new Date();
    const timestamp = Math.floor(date.getTime()/1000);

    const meta:T.BlockMeta = {
        kind:'key',
        version:constant.my_version,
        network_id:constant.my_net_id,
        chain_id:constant.my_chain_id,
        validator:native_validator,
        height:chain.length,
        previoushash:previoushash,
        timestamp:timestamp,
        pos_diff:pos_diff,
        validatorPub:validatorPub,
        stateroot:stateroot,
        lockroot:lockroot,
        tx_root:_.toHash(''),
        fee_sum:0,
        extra:extra
    }
    const hash = _.ObjectHash(meta);
    return {
        hash:hash,
        validatorSign:[],
        meta:meta,
        txs:[],
        raws:[]
    }
}

export const CreateMicroBlock = (chain:T.Block[],stateroot:string,lockroot:string,txs:T.Tx[],extra:string):T.Block=>{
    const empty = empty_block();
    const last = chain[chain.length-1] || empty;
    const key = search_key_block(chain);
    const date = new Date();
    const timestamp = Math.floor(date.getTime()/1000);
    const pures:T.TxPure[] = txs.map(tx=>TxSet.tx_to_pure(tx));
    const raws:T.TxRaw[] = txs.map(tx=>tx.raw);
    const tx_root = GetTreeroot(txs.map(t=>t.hash))[0];
    const fee_sum = tx_fee_sum(pures,raws);

    const meta:T.BlockMeta = {
        kind:'micro',
        version:constant.my_version,
        network_id:constant.my_net_id,
        chain_id:constant.my_chain_id,
        validator:key.meta.validator,
        height:chain.length,
        previoushash:last.hash,
        timestamp:timestamp,
        pos_diff:key.meta.pos_diff,
        validatorPub:[],
        stateroot:stateroot,
        lockroot:lockroot,
        tx_root:tx_root,
        fee_sum:fee_sum,
        extra:extra
    }
    const hash = _.ObjectHash(meta);
    return {
        hash:hash,
        validatorSign:[],
        meta:meta,
        txs:pures,
        raws:raws
    }
}

export const SignBlock = (block:T.Block,pub_keys:string[],my_private:string,my_pub:string)=>{
    const index = pub_keys.indexOf(my_pub);
    if(index===-1) return block;
    const sign = CryptoSet.SignData(block.hash,my_private);
    const signed = _.new_obj(
        block,
        b=>{
            b.validatorSign[index] = sign;
            return b;
        }
    )
    return signed;
}

const compute_issue = (height:number)=>{
    const all_issue = constant.all_issue;
    const cycle = constant.cycle;
    const n:number = math.chain(height).divide(cycle).fix().done();
    const new_amount:number = math.chain(all_issue).multiply(math.pow(0.5,n+1)).done();
    const pre_amount:number = math.chain(all_issue).multiply(math.pow(0.5,n)).done();
    const issue:number = math.chain(pre_amount).subtract(new_amount).divide(cycle).done();
    if(math.chain(issue).smallerEq(math.pow(10,-18)).done() as boolean) return 0;
    else return issue;
}

export const AcceptKeyBlock = (block:T.Block,chain:T.Block[],StateData:T.State[],LockData:T.Lock[]):[T.State[],T.Lock[]]=>{
    const last_key = search_key_block(chain);
    const last_micros = search_micro_block(chain,last_key);
    const fees:number = last_micros.reduce((sum,b)=>math.chain(sum).add(b.meta.fee_sum).done(),0);
    const issues = last_micros.concat(last_key).reduce((sum,b)=>math.chain(sum).add(compute_issue(b.meta.height)).done() as number,0);
    const fee_sum:number = math.chain(fees).add(issues).done();
    const pre_fee:number = math.multiply(fee_sum,0.4);
    const next_fee:number = math.multiply(fee_sum,0.6);
    const paid = StateData.map(s=>{
        const fee = Number(s.data.fee||"0");
        if(fee===0) return s;
        return _.new_obj(
            s,
            s=>{
                s.amount = math.chain(s.amount).subtract(fee).done();
                s.data.fee = "0";
                return s;
            }
        )
    });
    const validators = [last_key.meta.validator,block.meta.validator];
    const gained = paid.map(s=>{
        const i = validators.indexOf(s.owner);
        if(i===-1) return s;
        const gain = (()=>{
            if(i===0) return pre_fee;
            else if(i===1) return next_fee;
            else return 0;
        })();
        return _.new_obj(
            s,
            s=>{
                s.amount = math.chain(s.amount).add(gain).done();
                s.data.income = math.chain(Number(s.data.income||"0")).add(gain).done().toFixed(18);
                return s;
            }
        )
    });
    const reduced = gained.map(s=>{
        if(s.kind!="state"||s.token!=constant.unit) return s;
        return _.new_obj(
          s,
          s=>{
            s.amount = math.chain(s.amount).multiply(constant.unit_rate).done();
            return s;
          }
        )
    });
    return [reduced,LockData];
}

export const AcceptMicroBlock = (block:T.Block,chain:T.Block[],StateData:T.State[],LockData:T.Lock[]):[T.State[],T.Lock[]]=>{
    const first_data:[T.State[],T.Lock[]] = [StateData,LockData];
    const txs = block.txs.map(pure=>TxSet.pure_to_tx(pure,block));
    const txed = txs.reduce((data:[T.State[],T.Lock[]],tx,i)=>{
        if(tx.meta.kind==="request") return TxSet.AcceptRequestTx(tx,block.meta.height,block.hash,i,data[0],data[1]);
        else if(tx.meta.kind==="refresh") return TxSet.AcceptRefreshTx(tx,chain,data[0],data[1]);
        else return data;
    },first_data);
    const reduced = txed[0].map(s=>{
        if(s.kind!="state"||s.token!=constant.unit) return s;
        return _.new_obj(
          s,
          s=>{
            s.amount = math.chain(s.amount).multiply(constant.unit_rate).done();
            return s;
          }
        )
    });
    return [reduced,txed[1]];
}