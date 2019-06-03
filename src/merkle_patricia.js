"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Merkle = require('merkle-patricia-tree/secure');
/*
export class Trie implements ITrie{
  readonly trie:db_able;
  constructor(db:IDBRepository,root:string=""){
    if(root==="") this.trie = new Merkle(db.db);
    else this.trie = new Merkle(db.db,Buffer.from(root,'hex'));
  }

  async get<T>(key:IHex):Promise<Result<T|null,Err.TrieError>>{
    const result:string = await promisify(this.trie.get).bind(this.trie)(key.value);
    if(result==null) return new Result(null, new Err.TrieError("got null data from trie"));
    else return new Result(JSON.parse(result));
  }

  async put<T>(key:IHex,value:T):Promise<void>{
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
*/
