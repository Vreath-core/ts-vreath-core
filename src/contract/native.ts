import * as _ from '../util'
import * as T from '../types'
import {constant} from '../constant'
import bigInt from 'big-integer'

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
          return _.new_obj(
            s,
            (s)=>{
              s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
              s.amount = _.bigInt2hex(bigInt(s.amount,16).subtract(sum));
              return s;
            }
          )
        });
        const recieved = remited.map(s=>{
          const index = receivers.indexOf(s.owner);
          if(bigInt(s.token,16).notEquals(bigInt(native,16))||index===-1) return s;
          return _.new_obj(
            s,
            s=>{
              s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
              s.amount = _.bigInt2hex(bigInt(s.amount,16).add(bigInt(amounts[index],16)));
              return s;
            }
          )
        });
        const sub_income = recieved.map(s=>{
            if(bigInt(s.token,16).notEquals(bigInt(native,16))) return s;
            const income = bigInt(s.data[2]||"00",16);
            return _.new_obj(
                s,
                s=>{
                  s.nonce = _.bigInt2hex(bigInt(s.nonce,16).add(1));
                  s.amount = _.bigInt2hex(bigInt(s.amount,16).subtract(income));
                  return s;
                }
              )
        });
        return sub_income;

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

            const amount_check = base_state.some((s,i)=>{
                const index = receivers.indexOf(s.owner);
                if(bigInt(s.token,16).notEquals(bigInt(native,16))||index===-1) return false;
                const income = bigInt(s.data[2]||"00",16);
                const output = output_state[i];
                return bigInt(output.nonce,16).lesser(bigInt(s.nonce,16)) || s.owner!=output.owner /*|| bigInt(s.amount,16).subtract(income).subtract(sum).add(bigInt(amounts[index],16)).notEquals(bigInt(output.amount,16))*/;
            });
            if(amount_check) return false;

            return true;
        default: return false;
    }
}
