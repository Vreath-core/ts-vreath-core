import assert = require('assert');
import * as data_set from '../src/data'
import * as fs from 'fs'
import * as path from 'path'
import levelup, { LevelUp } from 'levelup';
import leveldown, { LevelDown, Bytes } from 'leveldown';
import {DB} from '../src/db'

class leveldb {
    private db:LevelUp<LevelDown>;
    constructor(_db:LevelUp<LevelDown>){
        this.db = _db;
    }

    public async get(key:Buffer):Promise<Buffer>{
        const got = await this.db.get(key);
        if(typeof got ==='string') return Buffer.from(key);
        else return got;
    }

    public async put(key:Buffer,val:Buffer):Promise<void>{
        await this.db.put(key,val);
    }

    public async del(key:Buffer):Promise<void>{
        await this.db.del(key);
    }

    public createReadStream():NodeJS.ReadableStream{
        return this.db.createReadStream();
    }

    get raw_db(){
        return this.db;
    }
}

const make_db_obj = (root:string)=>{
    const levelup_obj = new levelup(leveldown(path.join(root)));
    const leveldb_obj = new leveldb(levelup_obj);
    return new DB(leveldb_obj)
}


describe("data_set",()=>{
    const db = make_db_obj(path.join(__dirname,`../test_db/trie`));
    const trie = data_set.db_trie_ins(db);
    const alice = "123456"
    const state1 = {nonce:10,owner:alice,amount:100};
    const bob = "789876"
    const state2 = {nonce:20,owner:bob,amount:200};
    it("trie_ins", async ()=>{
        await trie.put(alice,state1);
        assert.deepEqual(await trie.get<{nonce:number,owner:string,amount:number}>(alice),state1,'error in get and put funcs');
        await trie.delete(alice);
        assert.equal(await trie.get<{nonce:number,owner:string,amount:number}>(alice),null,"error in del funcs");
    });
})