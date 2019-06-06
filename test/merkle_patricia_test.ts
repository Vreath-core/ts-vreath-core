import assert = require('assert');
import {Trie,trie_able} from '../src/merkle_patricia'
import {ReadableStream,TestDB} from './db_test'
import {MerklePatriciaTree,MerklePatriciaTreeNode} from '@rainblock/merkle-patricia-tree';

class Merkle implements trie_able{
    private keys:Buffer[] = [];
    private merkle = new MerklePatriciaTree()
    constructor(){}

    get root(){
        return this.merkle.root;
    }

    async get(key:Buffer){
        const got = this.merkle.get(key).value;
        if(got==null) return null;
        else return got;
    }
    async put(key:Buffer,val:Buffer){
        this.merkle.put(key,val);
        this.keys.push(key);
    }
    async del(key:Buffer){
        this.merkle.del(key);
        const i = this.keys.indexOf(key);
        this.keys.splice(i,1);
    }
    createReadStream(){
        let keys = this.keys;
        let values = keys.map(key=>this.merkle.get(key).value);
        let i:string;
        let val:Buffer|null;
        let buf:Buffer;
        let result:Buffer[] = [];
        for(i in values){
            val = values[i];
            if(val==null){
                keys.splice(Number(i),1);
            }
            else{
                buf = val;
                result.push(buf);
            }
        }
        const stream = new ReadableStream(keys,result);
        return stream;
    }
}

describe('Trie',()=>{
    const merkle = new Merkle();
    const trie = new Trie(merkle);
    const alice = "123456"
    const state1 = {nonce:10,owner:alice,amount:100};
    const bob = "789876"
    const state2 = {nonce:20,owner:bob,amount:200};
    it("test get, put and del",async ()=>{
        await trie.put(alice,state1);
        assert.deepEqual(await trie.get<{nonce:number,owner:string,amount:number}>(alice),state1,'error in get and put funcs');
        await trie.delete(alice);
        assert.equal(await trie.get<{nonce:number,owner:string,amount:number}>(alice),null,"error in del funcs");
    });

    it("test createReadstream", async ()=>{
        await trie.put(alice,state1);
        await trie.put(bob,state2);
        const all:{nonce:number,owner:string,amount:number}[] = await trie.filter();
        const expected = [state1,state2];
        assert.deepEqual(all,expected,"error in createReadstream func");
    });
});
