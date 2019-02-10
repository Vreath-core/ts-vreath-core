import * as math from 'mathjs'
math.config({
    number: 'BigNumber'
});

const size = 100;
const def_diff = 0.1;

export const get_diff = (diffs:number[],target_time:number,solvetimes:number[]):number=>{
    if(diffs.length!=size+1 || solvetimes.length!=size+1) return def_diff;
    let pre_time:number = math.chain(solvetimes[0]).subtract(target_time).done();
    let this_time:number = 0;
    let L:number = 0;
    let i:number;
    for(i=1; i<=size; i++){
        if(math.chain(solvetimes[i]).larger(pre_time).done() as boolean) this_time = solvetimes[i];
        else this_time = math.chain(pre_time).add(1).done();
        L = math.chain(L).add(math.min(math.multiply(6,solvetimes),math.subtract(this_time,pre_time))).done();
        pre_time = this_time;
    }
    if(math.chain(size).multiply(size).multiply(target_time).divide(20).larger(L).done() as boolean) L = math.chain(size).multiply(size).multiply(target_time).divide(20).done();
    let avg_D:number = math.chain(diffs[size]).subtract(diffs[0]).divide(size).done();
    let next_D:number = 0;
    if(math.chain(2000000).multiply(size).multiply(size).multiply(target_time).smaller(avg_D)) next_D = math.chain(avg_D).divide(200).divide(L).multiply(size).multiply(size+1).multiply(target_time).multiply(99).done();
    else next_D = math.chain(avg_D).multiply(size).multiply(size).multiply(size+1).multiply(target_time).multiply(99).divide(200).divide(L).done();
    return next_D;
}
