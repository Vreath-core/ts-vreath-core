import * as T from './types'
import  {DB} from './db'
import {constant} from './constant'
import * as _ from './util'
import bigInt, { BigInteger } from 'big-integer'


const size = constant.lwma_size;
const def_diff = constant.def_pos_diff;
const target_time = constant.block_time*(constant.max_blocks+1);

/*const get_lwma_infos = async (block_db:DB,last_height:string)=>{
    let blocks:T.Block[] = [];
    let block:T.Block|null = null;
    let height = bigInt(last_height,16);
    while(height.notEquals(0)){
        if(blocks.length>=size+1) break;
        block = await block_db.read_obj(_.bigInt2hex(height));
        height = height.subtract(1);
        if(block==null||block.meta.kind!=0) continue;
        blocks.push(block);
    }
    const infos = blocks.reduce((res:{times:number[],cumulative_diffs:BigInteger[]},block,i)=>{
        res.times.push(block.meta.timestamp);
        res.cumulative_diffs.push(bigInt(res.cumulative_diffs[i-1]||0).add(bigInt(block.meta.pos_diff,16)));
        return res;
    },{times:[],cumulative_diffs:[]});
    return infos;

}

export const get_diff = async (block_db:DB,last_height:string):Promise<string>=>{
    const info = await get_lwma_infos(block_db,last_height);
    const cumulative_diffs = info.cumulative_diffs;
    const solvetimes = info.times;
    if(cumulative_diffs.length!=size+1 || solvetimes.length!=size+1) return def_diff;
    let pre_time = bigInt(solvetimes[0]).subtract(target_time);
    let this_time = bigInt(0);
    let L = bigInt(0);
    let i:number;
    for(i=1; i<=size; i++){
        if(!bigInt(solvetimes[i]).lesserOrEquals(pre_time)) this_time = bigInt(solvetimes[i]);
        else this_time = bigInt(pre_time).add(1);
        L = bigInt(L).add(bigInt(i).multiply(bigInt.min(bigInt(6).multiply(target_time),bigInt(this_time).subtract(pre_time))));
        pre_time = this_time;
    }
    if(!bigInt(size).multiply(size).multiply(target_time).divide(20).lesserOrEquals(L)) L = bigInt(size).multiply(size).multiply(target_time).divide(20);
    let avg_D = bigInt(cumulative_diffs[size]).subtract(cumulative_diffs[0]).divide(size);
    let next_D = bigInt(0);
    if(bigInt(2000000).multiply(size).multiply(size).multiply(target_time).lesser(avg_D)) next_D = bigInt(avg_D).divide(200).divide(L).multiply(size).multiply(size+1).multiply(target_time).multiply(99);
    else next_D = bigInt(avg_D).multiply(size).multiply(size+1).multiply(target_time).multiply(99).divide(200).divide(L);
    return _.bigInt2hex(next_D);
}*/

const times = bigInt(constant.block_time).multiply(constant.max_blocks+1);

export const get_diff = (amount:string)=>{
    return _.bigInt2hex(bigInt(amount,16).multiply(times));
}
