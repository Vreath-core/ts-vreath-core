import assert = require('assert');
import * as data_set from '../src/data'
import {leveldb,make_db_obj} from './com'



describe("data_set",()=>{
    const db = make_db_obj();
    const trie = data_set.trie_ins(db);
    const alice = "123456"
    const state1 = {nonce:10,owner:alice,amount:100};
    it("trie_ins", async ()=>{
        await trie.put(alice,state1);
        assert.deepEqual(await trie.get<{nonce:number,owner:string,amount:number}>(alice),state1,'error in get and put funcs');
        await trie.delete(alice);
        assert.equal(await trie.get<{nonce:number,owner:string,amount:number}>(alice),null,"error in del funcs");
    });
})