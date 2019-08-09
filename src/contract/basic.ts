import * as _ from '../util'
import * as T from '../types'
import * as tx_set from '../tx'
import {constant} from '../constant'
import bigInt, { BigInteger } from 'big-integer'
import * as P from 'p-iteration'
import { DB } from '../db';

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
export const ref_tx_change = (bases:string[],base_state:T.State[],requester:string,refresher:string,fee:string,gas:string,new_height:string,income_map:{[key:string]:string})=>{
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
        const income = bigInt(s.data[2]||"00",16).add(bigInt(income_map[s.owner]||"00",16));
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
        const reduce = bigInt.max(bigInt(new_height,16).subtract(bigInt(pre_height,16)),bigInt(1));
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
export const key_block_change = (base_state:T.State[],validator_1:string,validator_2:string,fee:string,new_height:string,locks:T.Lock[])=>{
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
    const lock_owners = locks.map(l=>l.address);
    const reduced = gained.map(s=>{
        const i = lock_owners.indexOf(s.owner);
        const lock = locks[i];
        if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.data[0]!="01"||lock.state===1) return s;
        const pre_height = s.data[1];
        const reduce = bigInt.max(bigInt(new_height,16).subtract(bigInt(pre_height,16)),bigInt(1));
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
export const micro_block_change = (base_state:T.State[],new_height:string,locks:T.Lock[])=>{
    const lock_owners = locks.map(l=>l.address);
    return base_state.map(s=>{
        const i = lock_owners.indexOf(s.owner);
        const lock = locks[i];
        if(bigInt(s.token,16).notEquals(bigInt(constant.unit,16))||s.data[0]!="01"||lock.state===1) return s;
        const pre_height = s.data[1];
        const reduce = bigInt.max(bigInt(new_height,16).subtract(bigInt(pre_height,16)),bigInt(1));
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
