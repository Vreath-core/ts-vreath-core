import * as _ from '../util'
import * as T from '../types'
import * as tx_set from '../tx'
import {constant} from '../constant'
import bigInt, { BigInteger } from 'big-integer'
import * as P from 'p-iteration'
import { DB } from '../db';
import {native_prove, native_verify} from './native'

export const unit_prove = async (bases:string[],base_state:T.State[],input_data:string[],block_db:DB,new_height:string)=>{
    const unit_base = bases.filter(str=>bigInt(_.slice_token_part(str),16).eq(bigInt(constant.unit,16)));
    const native_base = bases.filter(str=>bigInt(_.slice_token_part(str),16).eq(bigInt(constant.native,16)));
    const unit_states = base_state.filter(s=>bigInt(s.token,16).eq(bigInt(constant.unit,16)));
    const units:T.Unit[] = input_data.slice(1).reduce((res:T.Unit[],val,i,array)=>{
        if(i%5===0){
            const unit:T.Unit = [array[i],Number(array[i+1]),array[i+2],array[i+3],array[i+4]];
            res.push(unit);
        }
        return res;
    },[]);
    const unit_miners = units.map(u=>u[3]).filter((val,i,array)=>array.indexOf(val)===i);
    const type = input_data[0];
    switch(type){
        case "00":
            const unit_validator = unit_base[0];
            const native_validator = native_base[0];
            const unit_base_hash_parts = unit_base.map(add=>_.slice_hash_part(add));
            const native_base_hash_parts = native_base.map(add=>_.slice_hash_part(add));
            if(unit_base.length!=units.length+1||_.slice_hash_part(unit_validator)!=_.slice_hash_part(native_validator)||unit_miners.some(add=>bigInt(_.slice_token_part(add),16).notEquals(bigInt(constant.unit,16))||native_base_hash_parts.indexOf(_.slice_hash_part(add))===-1)) return base_state;
            const unit_verify = await P.some(units,async (unit,i)=>{
                const ref_block:T.Block|null = await block_db.read_obj(unit[0]);
                if(ref_block==null) return true;
                const ref_tx = ref_block.txs[unit[1]];
                if(ref_tx==null) return true;
                const height = ref_tx.meta.refresh.height || "00";
                const req_block:T.Block|null = await block_db.read_obj(height);
                if(req_block==null) return true;
                const req_tx = req_block.txs[ref_tx.meta.refresh.index];
                if(req_tx==null) return true;
                const output_hash = _.array2hash(ref_tx.meta.refresh.output);
                const iden = _.array2hash([req_tx.hash,height,req_block.hash,unit[3],output_hash]);
                const hash = await tx_set.unit_hash(req_tx.hash,req_block.hash,height,unit[2],unit[3],output_hash,unit[4]);
                return !bigInt(hash,16).lesserOrEquals(bigInt(constant.pow_target,16)) || unit_base_hash_parts[i+1]!=iden || unit_states[i+1].data.length!=0;
            });
            if(unit_verify) return base_state;
            let unit_price_map:{[key:string]:BigInteger} = units.reduce((res:{[key:string]:BigInteger},unit)=>{
                const hash = _.slice_hash_part(unit[3]);
                if(res[hash]==null){
                res[hash] = bigInt(unit[4],16);
                return res;
                }
                else{
                res[hash] = bigInt(res[hash]).add(bigInt(unit[4],16));
                return res;
                }
            },{});
            const unit_sum = bigInt(constant.one_hex,16).multiply(units.length);
            const unit_bought = base_state.map(s=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.owner!=unit_base[0]) return s;
                const flag = s.data[0];
                if(flag==="00") return s;
                const pre_height = s.data[1];
                const reduce = bigInt.max(bigInt(new_height,16).subtract(bigInt(pre_height,16)),bigInt(1));
                const amount = (()=>{
                    const computed = (bigInt(s.amount,16).add(unit_sum)).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
                    if(computed.lesser(1)) return bigInt("00");
                    else return computed;
                })();
                return _.new_obj(
                    s,
                    s=>{
                        s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
                        s.amount = _.bigInt2hex(amount);
                        s.data[0] = "01";
                        s.data[1] = new_height;
                        return s;
                    }
                );
            });
            const unit_used = unit_bought.map(s=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||unit_base.slice(1).indexOf(s.owner)===-1) return s;
                return _.new_obj(
                    s,
                    s=>{
                        s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
                        s.data[0] = "00";
                        s.data[1] = new_height;
                        return s;
                    }
                )
            });
            const native_states = unit_used.filter(s=>bigInt(s.token,16).eq(bigInt(constant.native,16)));
            unit_price_map[_.slice_hash_part(native_validator)] = bigInt(0);
            const native_input = ["00"].concat(native_base_hash_parts.map(key=>unit_price_map[key]||bigInt(0)).map(big=>_.bigInt2hex(big)));
            const paid = native_prove(native_base,native_states,native_input);
            const result = unit_used.map(state=>{
                if(bigInt(state.token,16).eq(bigInt(constant.native,16))) return paid.filter(s=>bigInt(s.token,16).eq(bigInt(constant.native,16))&&s.owner===state.owner)[0];
                else return state;
            });
            return result;

        default: return base_state;
    }
}

export const unit_verify = async (bases:string[],base_state:T.State[],input_data:string[],output_state:T.State[],block_db:DB,new_height:string)=>{
    const unit_base = bases.filter(str=>bigInt(_.slice_token_part(str),16).eq(bigInt(constant.unit,16)));
    const native_base = bases.filter(str=>bigInt(_.slice_token_part(str),16).eq(bigInt(constant.native,16)));
    const unit_states = base_state.filter(s=>bigInt(s.token,16).eq(bigInt(constant.unit,16)));
    const units:T.Unit[] = input_data.slice(1).reduce((res:T.Unit[],val,i,array)=>{
        if(i%5===0){
            const unit:T.Unit = [array[i],Number(array[i+1]),array[i+2],array[i+3],array[i+4]];
            res.push(unit);
        }
        return res;
    },[]);
    const unit_miners = units.map(u=>u[3]).filter((val,i,array)=>array.indexOf(val)===i);
    const type = input_data[0];
    switch(type){
        case "00":
            const unit_validator = unit_base[0];
            const native_validator = native_base[0];
            const unit_base_hash_parts = unit_base.map(add=>_.slice_hash_part(add));
            const native_base_hash_parts = native_base.map(add=>_.slice_hash_part(add));
            if(unit_base.length!=units.length+1||_.slice_hash_part(unit_validator)!=_.slice_hash_part(native_validator)||unit_miners.some(add=>bigInt(_.slice_token_part(add),16).notEquals(bigInt(constant.unit,16))||native_base_hash_parts.indexOf(_.slice_hash_part(add))===-1)) return false;
            const unit_verify = await P.some(units,async (unit,i)=>{
                const ref_block:T.Block|null = await block_db.read_obj(unit[0]);
                if(ref_block==null) return true;
                const ref_tx = ref_block.txs[unit[1]];
                if(ref_tx==null) return true;
                const height = ref_tx.meta.refresh.height || "00";
                const req_block:T.Block|null = await block_db.read_obj(height);
                if(req_block==null) return true;
                const req_tx = req_block.txs[ref_tx.meta.refresh.index];
                if(req_tx==null) return true;
                const output_hash = _.array2hash(ref_tx.meta.refresh.output);
                const iden = await _.array2hash([req_tx.hash,height,req_block.hash,unit[3],output_hash]);
                const hash = await tx_set.unit_hash(req_tx.hash,height,req_block.hash,unit[2],unit[3],output_hash,unit[4]);
                return !bigInt(hash,16).lesserOrEquals(bigInt(constant.pow_target,16)) || unit_base_hash_parts[i+1]!=iden || unit_states[i+1].data.length!=0;
            });
            if(unit_verify) return false;
            let unit_price_map:{[key:string]:BigInteger} = units.reduce((res:{[key:string]:BigInteger},unit)=>{
                const hash = _.slice_hash_part(unit[3]);
                if(res[hash]==null){
                    res[hash] = bigInt(unit[4],16);
                    return res;
                }
                else{
                    res[hash] = bigInt(res[hash]).add(bigInt(unit[4],16));
                    return res;
                }
            },{});
            const unit_sum = bigInt(constant.one_hex,16).multiply(units.length);
            const unit_bought = base_state.some((s,i)=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.owner!=unit_base[0]) return false;
                const output = output_state[i];
                const pre_flag = s.data[0];
                const new_flag = output.data[0];
                if(pre_flag==="00"||new_flag!="01") return true;
                const pre_height = s.data[1];
                const reduce = bigInt.max(bigInt(new_height,16).subtract(bigInt(pre_height,16)),bigInt(1));
                const amount = (()=>{
                    const computed = (bigInt(s.amount,16).add(unit_sum)).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
                    if(computed.lesser(1)) return bigInt("00");
                    else return computed;
                })();
                return bigInt(output.nonce,16).subtract(bigInt(s.nonce,16)).notEquals(1) || s.owner!=output.owner || amount.notEquals(bigInt(output.amount,16)) || pre_flag==="00" || new_flag!="01" || output.data[1]!=new_height || bigInt(output.data[1],16).notEquals(bigInt(s.data[1],16));
            });
            if(unit_bought) return false;
            const unit_used = base_state.some((s,i)=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||unit_base.slice(1).indexOf(s.owner)===-1) return false;
                const output = output_state[i];
                return bigInt(output.nonce,16).subtract(bigInt(s.nonce,16)).notEquals(1) || s.owner!=output.owner || s.data[0]!=null || output.data[0]!="00" || output.data[1]!=new_height || bigInt(output.data[1],16).lesserOrEquals(bigInt(s.data[1],16));
            });
            if(unit_used) return false;
            unit_price_map[_.slice_hash_part(native_validator)] = bigInt(0);
            const native_input = ["00"].concat(native_base_hash_parts.map(key=>unit_price_map[key]||bigInt(0)).map(big=>_.bigInt2hex(big)));
            const native_base_states = base_state.filter(s=>bigInt(s.token,16).eq(bigInt(constant.native,16)));
            const native_output_states = output_state.filter(s=>bigInt(s.token,16).eq(bigInt(constant.native,16)));
            const paid = native_verify(native_base,native_base_states,native_input,native_output_states);
            if(!paid) return false;
            return true;

        default: return false;
    }
}