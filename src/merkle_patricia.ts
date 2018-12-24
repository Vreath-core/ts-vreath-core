import * as Merkle from 'merkle-patricia-tree/secure'
import * as rlp from 'rlp'
import {promisify} from 'util'
import levelup from 'levelup'
import leveldown from 'leveldown'

export const en_key = (key:string):string=>{
  return rlp.encode(key).toString('hex');
}

export const de_key = (key:string):string=>{
  return rlp.decode(Buffer.from(key,'hex')).toString('utf-8')
}


export const en_value = <T>(value:T):string=>{
  return rlp.encode(JSON.stringify(value)).toString('hex');
}

export const de_value = (value:string)=>{
  return JSON.parse(rlp.decode(Buffer.from(value,'hex')).toString());
}


export class Trie {
  private trie:any;
  constructor(db:any,root:string=""){
    if(root==="") this.trie = new Merkle(db);
    else this.trie = new Merkle(db,Buffer.from(root,'hex'));
  }

  async get(key:string){
    const result:string = await promisify(this.trie.get).bind(this.trie)(key);
    if(result==null) return null;
    return JSON.parse(result);
  }

  async put(key:string,value:any){
    await promisify(this.trie.put).bind(this.trie)(key,JSON.stringify(value));
    return this.trie;
  }

  async delete(key:string){
    await promisify(this.trie.del).bind(this.trie)(key);
    return this.trie;
  }

  now_root():string{
    return this.trie.root.toString("hex");
  }

  checkpoint(){
    this.trie.checkpoint();
    return this.trie;
  }

  async filter<T>(check:(value:T)=>boolean=(value:T)=>true){
    let result:T[] = [];
    const stream = this.trie.createReadStream();
    return new Promise<T[]>((resolve,reject)=>{
      try{
        stream.on('data',(data:{key:Buffer,value:Buffer})=>{
          const value:T = JSON.parse(data.value.toString());
          if(check(value)) result.push(value);
        });

        stream.on('end',(data:{key:string,value:any})=>{
          resolve(result);
        });
      }
      catch(e){reject(e)}
    });
  }

  async checkRoot(root:string){
    const result:boolean = await promisify(this.trie.checkRoot).bind(this.trie)(en_key(root));
    if(result==null) return false;
    return result
  }
}
