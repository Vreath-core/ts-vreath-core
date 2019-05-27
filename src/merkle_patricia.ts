const Merkle = require('merkle-patricia-tree/secure');
import * as T from './types'
import * as rlp from 'rlp'
import {promisify} from 'util'
import {DB} from './db';

export const en_key = (key:T.Hex):T.Hex=>{
  const val = rlp.encode(key.to_str()).toString('hex');
}

export const de_key = (key:T.Hex):T.Hex=>{
  const val = rlp.decode(Buffer.from(key.to_str(),'hex')).toString('utf-8')
}


export const en_value = <T>(value:T):T.Hex=>{
  const val = rlp.encode(JSON.stringify(value)).toString('hex');
}

export const de_value = (value:T.Hex)=>{
  return JSON.parse(rlp.decode(Buffer.from(value,'hex')).toString());
}


export class Trie implements T.Trie{
  readonly trie:any;
  constructor(db:DB,root:string=""){
    if(root==="") this.trie = new Merkle(db.db);
    else this.trie = new Merkle(db.db,Buffer.from(root,'hex'));
  }

  async get<T>(key:T.Hex):Promise<T|null>{
    const result:string = await promisify(this.trie.get).bind(this.trie)(key);
    if(result==null) return null;
    return JSON.parse(result);
  }

  async put<T>(key:T.Hex,value:T):Promise<void>{
    await promisify(this.trie.put).bind(this.trie)(key,JSON.stringify(value));
  }

  async delete(key:T.Hex):Promise<void>{
    await promisify(this.trie.del).bind(this.trie)(key);
  }

  now_root():T.Hash{
    return this.trie.root.toString("hex");
  }

  checkpoint():void{
    this.trie.checkpoint();
  }

  async filter<T>(check:(value:T)=>Promise<boolean>|boolean=(value:T)=>true){
    let result:T[] = [];
    const stream = this.trie.createReadStream();
    return new Promise<T[]>((resolve,reject)=>{
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
    });
  }

  async checkRoot(root:T.Hash){
    const result:boolean = await promisify(this.trie.checkRoot).bind(this.trie)(en_key(root));
    if(result==null) return false;
    return result
  }
}

