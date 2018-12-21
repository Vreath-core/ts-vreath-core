import * as math from 'mathjs'
math.config({
    number: 'BigNumber'
});

const get_lwma = (times:number[]):number=>{
    const n = times.length;
    const denominator:number = math.chain(n).multiply(n+1).divide(2).done();
    const numerator = times.reduce((res:number,time:number,i:number)=>{
        return math.chain(n-i).multiply(time).add(res).done();
    },0);
    return math.chain(numerator).divide(denominator).done();
}

export const get_diff = (diffs:number[],target_time:number,solvetimes:number[]):number=>{
    const average = math.divide(diffs.reduce((sum:number,diff)=>math.chain(sum).add(diff).done(),0),diffs.length);
    const lwma = get_lwma(solvetimes);
    return math.chain(average).multiply(target_time).divide(lwma).done();
}