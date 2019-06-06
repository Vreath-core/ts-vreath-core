import {promisify} from 'util'
import * as P from 'p-iteration'
import {DB,db_able} from './db';
const streamToPromise = require('stream-to-promise');

export interface trie_able extends db_able{
  root:Buffer;
}

export class Trie {
  constructor(private trie:trie_able){
  }

  async get<T>(key:string):Promise<T|null>{
    //const result:string = await promisify(this.trie.get).bind(this.trie)(key);
    const result = await this.trie.get(Buffer.from(key,'hex'));
    if(result==null) return null;
    return JSON.parse(result.toString('utf8'));
  }

  async put<T>(key:string,value:T):Promise<void>{
    //await promisify(this.trie.put).bind(this.trie)(key,JSON.stringify(value));
    await this.trie.put(Buffer.from(key,'hex'),Buffer.from(JSON.stringify(value),'utf8'))
  }

  async delete(key:string):Promise<void>{
    //await promisify(this.trie.del).bind(this.trie)(key);
    await this.trie.del(Buffer.from(key,'hex'));
  }

  now_root():string{
    return this.trie.root.toString("hex");
  }

  async filter<T>(check:(key:string,value:T)=>Promise<boolean>|boolean=(key:string,value:T)=>true){
    let result:T[] = [];
    const stream = this.trie.createReadStream();
    const data_array:{key:Buffer,value:Buffer}[] = await streamToPromise(stream);
    await P.forEach(data_array, async (data)=>{
      const key = data.key.toString('hex');
      const value:T = JSON.parse(data.value.toString('utf8'));
      if(await check(key,value)) result.push(value);
    });
    return result;

    /*return new Promise<T[]>((resolve,reject)=>{
      try{
        stream.on('data',async (data:{key:Buffer,value:Buffer})=>{
          if(data.value==null) return result;
          const value:T = JSON.parse(data.value.toString());
          if(await check(value)) result.push(value);
        });

        stream.on('end',(data:{key:string,value:any})=>{
          resolve(result);
        });
      }
      catch(e){reject(e)}
    });*/
  }
}
