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


export const finalize_hash = (height:string,hash:string)=>{
    const id = constant.finalize_keyword+constant.my_version+constant.my_chain_id+constant.my_net_id;
    return crypto_set.get_sha256(_.array2hash([id,height,hash]));
}

export const rocate_finalize_validators = (uniters:string[])=>{
    return uniters.reduce((res:string[],val,i)=>{
        if(i===0) res[uniters.length-1] = val;
        else res[i-1] = val;
        return res;
    },new Array(uniters.length));
}

const validators_drop_out = async (validators:string[],block_height:string,trie:Trie,state_db:DB)=>{
    const states:T.State[] = await P.map(validators,async address=>{
        return await data.read_from_trie(trie,state_db,address,0,state_set.CreateState("00",constant.unit,address,"00",["01","00"]));
    });
    const amounts = states.map(s=>{
        if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))) return bigInt("00");
        const flag = s.data[0];
        if(flag==="00") return bigInt("00");
        const pre_height = s.data[1];
        const reduce = bigInt.max(bigInt(block_height,16).subtract(bigInt(pre_height,16)),bigInt(1));
        return (()=>{
            const computed = bigInt(s.amount,16).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
            if(computed.lesser(1)) return bigInt("00");
            else return computed;
        })();
    });
    return validators.filter((address,i)=>{
        if(amounts[i].lesserOrEquals(0)) return false;
        else return true;
    })
}

export const choose_finalize_validators = async (uniters:string[],block_height:string,trie:Trie,state_db:DB)=>{
    let choosed:string[] = [];
    if(uniters.length<constant.finalize_size) choosed = uniters;
    else choosed = uniters.slice(0,constant.finalize_size);
    return await validators_drop_out(choosed,block_height,trie,state_db);
}

export const verify_finalized = async (key_block:T.Block,finalizes:T.Finalize[],uniters:string[],trie:Trie,state_db:DB)=>{
    const v_s = finalizes.map(f=>tx_set.get_recover_id_from_sign(f.sign));
    const pub_keys = finalizes.map((f,i)=>crypto_set.recover(finalize_hash(f.height,f.hash),f.sign.data,v_s[i]));
    const addresses = pub_keys.map(key=>crypto_set.generate_address(constant.unit,key));
    const finalize_validators = await choose_finalize_validators(uniters,key_block.meta.height,trie,state_db);
    if(addresses.some(add=>finalize_validators.indexOf(add)===-1)||addresses.filter((val,i,array)=>array.indexOf(val)===i).length!=addresses.length) return false;
    else if(bigInt(addresses.length).lesser(bigInt(finalize_validators.length).times(constant.fault_tolerance).divide(100))) return false;
    else return true;
}

export const sign_finalize = (height:string,hash:string,private_key:string)=>{
    const id = constant.my_version+constant.my_chain_id+constant.my_net_id;
    const signed = crypto_set.sign(finalize_hash(height,hash),private_key);
    const v = _.bigInt2hex(bigInt(id,16).multiply(2).add(8).add(bigInt(28).subtract(bigInt(signed[0],16))));
    const sign:T.Sign = {
        data:signed[1],
        v:v
    }
    const finalize:T.Finalize = {
        height:height,
        hash:hash,
        sign:sign
    }
    return finalize;
}
