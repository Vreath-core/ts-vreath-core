import * as _ from './util'
import * as T from './types'
import { Trie,trie_able } from './merkle_patricia';
const Merkle = require('merkle-patricia-tree/secure');
import {DB} from './db'
import {promisify} from 'util'

class PromiseMerkle implements trie_able {
    private merkle:any;
    constructor(_db:DB,_root?:string){
        this.merkle = _root!=null ? new Merkle(_db.set_db.raw_db,Buffer.from(_root,'hex')) : new Merkle(_db.set_db.raw_db);
    }
    get root():Buffer{
        return this.merkle.root;
    }
    async get(key:Buffer):Promise<Buffer|null>{
        return await promisify(this.merkle.get).bind(this.merkle)(key);
    }
    async put(key:Buffer,value:Buffer){
        await promisify(this.merkle.put).bind(this.merkle)(key,value);
    }
    async del(key:Buffer){
        await promisify(this.merkle.del).bind(this.merkle)(key);
    }
    createReadStream(){
        return this.merkle.createReadStream();
    }
}

/*class MemoryMerkle implements trie_able {
    private merkle = new MemMerkle.MerklePatriciaTree();
    constructor(){}

    get root():Buffer{
        return this.merkle.root();
    }
    async get(key:Buffer):Promise<Buffer|null>{
        return await this.merkle.get(key).value;
    }
    async put(key:Buffer,value:Buffer){
        await this.merkle.put(key,value);
    }
    async del(key:Buffer){
        await this.merkle.del(key);
    }
    createReadStream(){
        console.log(this.merkle.createReadStream())
        return this.merkle.createReadStream();
    }
}*/

export const trie_ins = (db:DB,root?:string)=>{
    return new Trie(new PromiseMerkle(db,root));
}


export const read_from_trie = async <T>(trie:Trie,db:DB,key:string,index:0|1,empty:T)=>{
    const hashes = await trie.get<[string,string]>(key);
    if(hashes==null) return empty;
    const raw:T|null = await db.read_obj(hashes[index]);
    if(raw==null) return empty;
    else return raw;
}

export const write_state_hash = async (db:DB,state:T.State)=>{
    const hash = _.array2hash([state.nonce,state.token,state.owner,state.amount].concat(state.data));
    await db.del(hash);
    await db.write_obj(hash,state);
    return hash;
}

export const write_lock_hash = async (db:DB,lock:T.Lock)=>{
    const state = "0"+lock.state.toString(16);
    let index = lock.index.toString(16);
    if(index.length%2!=0) index = "0"+index;
    const hash = _.array2hash([lock.address,state,lock.height,lock.block_hash,index,lock.tx_hash]);
    await db.del(hash);
    await db.write_obj(hash,lock);
    return hash;
}

export const write_trie = async (trie:Trie,state_db:DB,lock_db:DB,state:T.State,lock:T.Lock):Promise<void>=>{
    await trie.delete(state.owner);
    const state_hash = await write_state_hash(state_db,state);
    const lock_hash = await write_lock_hash(lock_db,lock);
    await trie.put(state.owner,[state_hash,lock_hash]);
}