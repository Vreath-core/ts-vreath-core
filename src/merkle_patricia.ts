const Merkle = require('merkle-patricia-tree/secure');
import * as T from './types'
import * as Err from './error'
import {Result} from './result'
import {IHex,Bit} from './util'
import {IHash,IAddress} from './crypto_set'
import * as rlp from 'rlp'
import {IDBRepository} from './db';
import {IState} from './state'
import { ILock } from './lock';
/*
export const en_key = (key:IHex):T.Hex=>{
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
}*/

type T_en_key = (key:IHex)=>IHex;
type T_de_key = (key:IHex)=>IHex;
type T_en_value = <T>(value:T)=>IHex;
type T_de_value = <T>(value:IHex)=>IHex;

export interface ITrie {
  readonly trie:IDBRepository;

  get<T>(key:IHex):Promise<Result<T|null,Err.TrieError>>

  put<T>(key:IHex,value:T):Promise<Result<void,Err.TrieError>>

  delete(key:IHex):Promise<Result<void,Err.TrieError>>

  now_root():Result<IHash,Err.TrieError>

  checkpoint():Result<void,Err.TrieError>

  filter<T>(check:(value:T)=>Promise<boolean>|boolean):Promise<Result<T[],Err.TrieError>>

  checkRoot(root:IHash):Promise<Result<boolean,Err.TrieError>>

}

export interface ITrieFactory {
  trie_ins(db:IDBRepository,root?:IHash):ITrie;
}

export interface ITrieServices {
  read_from_trie<T>(trie:ITrie,db:IDBRepository,key:IAddress,bit:Bit,empty:T):Result<Promise<T>,Err.TrieError>
  write_state_hash(db:IDBRepository,state:IState):Result<Promise<IHash>,Err.TrieError>
  write_lock_hash(db:IDBRepository,lock:ILock):Result<Promise<IHash>,Err.TrieError>
  write_trie(trie:ITrie,state_db:IDBRepository,lock_db:IDBRepository,state:IState,lock:ILock):Result<Promise<void>,Err.TrieError>
}
/*
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
*/
