import * as _ from './util'
import * as T from './types'
import * as tx_set from './tx'
import {constant} from './constant'
import bigInt, { BigInteger } from 'big-integer'
import * as P from 'p-iteration'
import { DB } from './db';

export const native_prove = (bases:string[],base_state:T.State[],input_data:string[]):T.State[]=>{
    const native = constant.native;
    const type = input_data[0];
    switch(type){
      case "00":
        const remiter = bases[0];
        const remiter_state = base_state[0];
        const receivers = bases;
        const amounts:string[] = input_data.slice(1);
        const sum = amounts.reduce((s,a)=>bigInt(a,16).add(s),bigInt(0));
        const fee = bigInt(remiter_state.data[0]||"00",16);
        const gas = bigInt(remiter_state.data[1]||"00",16);
        const income = bigInt(remiter_state.data[2]||"00",16);
        if(bigInt(remiter_state.amount,16).subtract(sum).subtract(fee).subtract(gas).subtract(income).lesser(0)||receivers.length!=amounts.length) return base_state;

        const remited = base_state.map(s=>{
          if(bigInt(s.token,16).notEquals(bigInt(native,16))||s.owner!=remiter) return s;
          const income = bigInt(s.data[2]||"00",16);
          return _.new_obj(
            s,
            (s)=>{
              s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
              s.amount = _.bigInt2hex(bigInt(s.amount,16).subtract(income).subtract(sum));
              return s;
            }
          )
        });
        const recieved = remited.map(s=>{
          const index = receivers.indexOf(s.owner);
          if(bigInt(s.token,16).notEquals(bigInt(native,16))||index===-1) return s;
          const income = bigInt(s.data[2]||"00",16);
          return _.new_obj(
            s,
            s=>{
              s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
              s.amount = _.bigInt2hex(bigInt(s.amount,16).subtract(income).subtract(bigInt(amounts[index],16)));
              return s;
            }
          )
        });
        return recieved;

    default: return base_state;
    }
}

export const native_verify = (bases:string[],base_state:T.State[],input_data:string[],output_state:T.State[])=>{
    const native = constant.native;
    const type = input_data[0];
    switch(type){
        case "00":
            const remiter = bases[0];
            const remiter_state = base_state[0];
            const receivers = bases;
            const amounts:string[] = input_data.slice(1);
            const sum = amounts.reduce((s,a)=>bigInt(a,16).add(s),bigInt(0));
            const fee = bigInt(remiter_state.data[0]||"00",16);
            const gas = bigInt(remiter_state.data[1]||"00",16);
            if(bigInt(remiter_state.amount,16).subtract(sum).subtract(fee).subtract(gas).lesser(0)||receivers.length!=amounts.length) return false;

            const remited = base_state.some((s,i)=>{
                if(bigInt(s.token,16).notEquals(bigInt(native,16))||s.owner!=remiter) return false;
                const income = bigInt(s.data[2]||"00",16);
                const output = output_state[i];
                return bigInt(output.nonce,16).subtract(bigInt(s.nonce,16)).notEquals(1) || s.owner!=output.owner || bigInt(s.amount,16).subtract(income).subtract(sum).notEquals(bigInt(output.amount,16));
            });
            if(remited) return false;
            const recieved = base_state.map((s,i)=>{
                const index = receivers.indexOf(s.owner);
                if(bigInt(s.token,16).notEquals(bigInt(native,16))||index===-1) return false;
                const income = bigInt(s.data[2]||"00",16);
                const output = output_state[i];
                return bigInt(output.nonce,16).subtract(bigInt(s.nonce,16)).notEquals(1) || s.owner!=output.owner || bigInt(s.amount,16).subtract(income).add(bigInt(amounts[index],16)).notEquals(bigInt(output.amount,16));
            });
            if(recieved) return false;
            return true;
        default: return false;
    }
}

export const unit_prove = async (bases:string[],base_state:T.State[],input_data:string[],block_db:DB,new_height:string)=>{
    const unit_base = bases.filter(str=>bigInt(_.slice_token_part(str),16).eq(bigInt(constant.unit,16)));
    const native_base = bases.filter(str=>bigInt(_.slice_token_part(str),16).eq(bigInt(constant.native,16)));
    const unit_states = base_state.filter(s=>s.token===constant.unit);
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
                return !bigInt(hash,16).lesserOrEquals(bigInt(constant.unit,16)) || unit_base_hash_parts[i+1]!=iden || unit_states[i+1].data.length!=0;
            });
            if(unit_verify) return base_state;
            const unit_price_map:{[key:string]:BigInteger} = units.reduce((res:{[key:string]:BigInteger},unit)=>{
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
            const unit_sum = units.length;
            const unit_bought = base_state.map(s=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.owner!=unit_base[0]) return s;
                const flag = s.data[0];
                if(flag==="00") return s;
                const pre_height = s.data[1];
                const reduce = bigInt(new_height,16).subtract(bigInt(pre_height,16));
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
            const native_states = unit_used.filter(s=>s.token===constant.native);
            const native_input = native_base_hash_parts.map(key=>unit_price_map[key]||bigInt(0)).map(big=>_.bigInt2hex(big));
            const paid = native_prove(native_base,native_states,native_input);
            const result = unit_used.map(state=>{
                if(state.token===constant.native) return paid.filter(s=>s.token===constant.native&&s.owner===state.owner)[0];
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
                return !bigInt(hash,16).lesserOrEquals(bigInt(constant.unit,16)) || unit_base_hash_parts[i+1]!=iden || unit_states[i+1].data.length!=0;
            });
            if(unit_verify) return false;
            const unit_price_map:{[key:string]:BigInteger} = units.reduce((res:{[key:string]:BigInteger},unit)=>{
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
            const unit_sum = units.length;
            const unit_bought = base_state.some((s,i)=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.owner!=unit_base[0]) return false;
                const output = output_state[i];
                const pre_flag = s.data[0];
                const new_flag = output.data[0];
                if(pre_flag==="00"||new_flag!="01") return true;
                const pre_height = s.data[1];
                const reduce = bigInt(new_height,16).subtract(bigInt(pre_height,16));
                const amount = (()=>{
                    const computed = (bigInt(s.amount,16).add(unit_sum)).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
                    if(computed.lesser(1)) return bigInt("00");
                    else return computed;
                })();
                return bigInt(output.nonce,16).subtract(bigInt(s.nonce,16)).notEquals(1) || s.owner!=output.owner || amount.notEquals(bigInt(output.amount,16)) || pre_flag==="00" || new_flag!="01" || output.data[1]!=new_height || bigInt(output.data[1],16).lesserOrEquals(bigInt(s.data[1],16));
            });
            if(unit_bought) return false;
            const unit_used = base_state.some((s,i)=>{
                if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||unit_base.slice(1).indexOf(s.owner)===-1) return false;
                const output = output_state[i];
                return bigInt(output.nonce,16).subtract(bigInt(s.nonce,16)).notEquals(1) || s.owner!=output.owner || s.data[0]!=null || output.data[0]!="00" || output.data[1]!=new_height || bigInt(output.data[1],16).lesserOrEquals(bigInt(s.data[1],16));
            });
            if(unit_used) return false;
            const native_input = native_base_hash_parts.map(key=>unit_price_map[key]||bigInt(0)).map(big=>_.bigInt2hex(big));
            const native_base_states = base_state.filter(s=>s.token===constant.native);
            const native_output_states = output_state.filter(s=>s.token===constant.native);
            const paid = native_verify(native_base,native_base_states,native_input,native_output_states);
            if(!paid) return false;
            return true;

        default: return false;
    }
}


export const req_tx_change = (base_state:T.State[],requester:string,fee:string,gas:string)=>{
    const reqed = base_state.map(s=>{
        if(s.owner!=requester) return s;
        return _.new_obj(
            s,
            s=>{
                if(s.data[0]==null) s.data[0] = "00";
                else s.data[0] = _.bigInt2hex(bigInt(s.data[0],16).add(bigInt(fee,16)));
                s.data[1] = gas;
                return s;
            }
        )
    });
    const gained = reqed.map(s=>{
        const income = bigInt(s.data[2]||"00",16);
        if(income.eq(0)) return s;
        return _.new_obj(
          s,
          s=>{
            s.data[2] = "00";
            return s;
          }
        )
    });
    return gained;
}

//requester, refresher, bases
export const ref_tx_change = (bases:string[],base_state:T.State[],requester:string,refresher:string,fee:string,gas:string,new_height:string)=>{
    const reqed = base_state.map(s=>{
        if(s.owner!=requester) return s;
        return _.new_obj(
            s,
            s=>{
                s.data[1] = "00";
                s.amount = _.bigInt2hex(bigInt(s.amount,16).subtract(bigInt(gas,16)));
                return s;
            }
        )
    });
    const refed = reqed.map(s=>{
        if(s.owner!=refresher) return s;
        return _.new_obj(
            s,
            s=>{
                s.amount = _.bigInt2hex(bigInt(s.amount,16).add(bigInt(gas,16)));
                if(s.data[0]==null) s.data[0] = fee;
                else s.data[0] = _.bigInt2hex(bigInt(s.data[0],16).add(bigInt(fee,16)));
                return s;
            }
        )
    });
    const gained = refed.map(s=>{
        const income = bigInt(s.data[2]||"00",16);
        if(income.eq(0)) return s;
        return _.new_obj(
            s,
            s=>{
                s.amount = _.bigInt2hex(bigInt(s.amount,16).add(income));
                s.data[2] = "00";
                return s;
            }
        )
    });
    const reduced = gained.map(s=>{
        if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||bases.indexOf(s.owner)===-1||s.data[0]!="01") return s;
        const pre_height = s.data[1];
        const reduce = bigInt(new_height,16).subtract(bigInt(pre_height,16));
        const amount = (()=>{
            const computed = bigInt(s.amount,16).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
            if(computed.lesser(1)) return bigInt("00");
            else return computed;
        })();
        return _.new_obj(
            s,
            s=>{
                s.data[1] = new_height;
                s.amount = _.bigInt2hex(amount);
                return s;
            }
        )
    });
    return reduced;
}

//native-requesters, native-refreshers, native-validator_1, native-validator_2, unit-validator_1, unit-validator_2
export const key_block_change = (base_state:T.State[],validator_1:string,validator_2:string,fee:string,new_height:string)=>{
    const fee_1 = bigInt(fee,16).multiply(4).divide(10);
    const fee_2 = bigInt(fee,16).multiply(6).divide(10);
    const paid = base_state.map(s=>{
        if(bigInt(s.token,16).notEquals(bigInt(constant.native,16))) return s;
        const fee = bigInt(s.data[0]||"00",16)
        if(fee.eq(0)) return s;
        return _.new_obj(
            s,
            s=>{
                s.amount = _.bigInt2hex(bigInt(s.amount,16).subtract(fee));
                s.data[0] = "00";
                return s;
            }
        )
    });
    const gained = paid.map(s=>{
        const i = [validator_1,validator_2].indexOf(s.owner);
        if(bigInt(s.token,16).notEquals(bigInt(constant.native,16))||i===-1) return s;
        const gain = (()=>{
            if(i===0) return fee_1;
            else if(i===1) return fee_2;
            else return 0;
        })();
        return _.new_obj(
            s,
            s=>{
                s.amount = _.bigInt2hex(bigInt(s.amount,16).add(gain));
                s.data[2] = _.bigInt2hex(bigInt(s.data[2]||"00",16).add(gain));
                return s;
            }
        )
    });
    const reduced = gained.map(s=>{
        if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.data[0]!="01") return s;
        const pre_height = s.data[1];
        const reduce = bigInt(new_height,16).subtract(bigInt(pre_height,16));
        const amount = (()=>{
            const computed = bigInt(s.amount,16).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
            if(computed.lesser(1)) return bigInt("00");
            else return computed;
        })();
        return _.new_obj(
            s,
            s=>{
                s.data[1] = new_height;
                s.amount = _.bigInt2hex(amount);
                return s;
            }
        )
    });
    return reduced;
}


//unit-validator
export const micro_block_change = (base_state:T.State[],new_height:string)=>{
    return base_state.map(s=>{
        if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.data[0]!="01") return s;
        const pre_height = s.data[1];
        const reduce = bigInt(new_height,16).subtract(bigInt(pre_height,16));
        const amount = (()=>{
            const computed = bigInt(s.amount,16).multiply(bigInt(constant.unit_rate).pow(reduce)).divide(bigInt(100).pow(reduce));
            if(computed.lesser(1)) return bigInt("00");
            else return computed;
        })();
        return _.new_obj(
            s,
            s=>{
                s.data[1] = new_height;
                s.amount = _.bigInt2hex(amount);
                return s;
            }
        )
    })
}