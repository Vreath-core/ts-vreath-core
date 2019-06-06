"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const merkle_patricia_1 = require("../src/merkle_patricia");
const db_test_1 = require("./db_test");
const merkle_patricia_tree_1 = require("@rainblock/merkle-patricia-tree");
class Merkle {
    constructor() {
        this.keys = [];
        this.merkle = new merkle_patricia_tree_1.MerklePatriciaTree();
    }
    get root() {
        return this.merkle.root;
    }
    async get(key) {
        const got = this.merkle.get(key).value;
        if (got == null)
            return null;
        else
            return got;
    }
    async put(key, val) {
        this.merkle.put(key, val);
        this.keys.push(key);
    }
    async del(key) {
        this.merkle.del(key);
        const i = this.keys.indexOf(key);
        this.keys.splice(i, 1);
    }
    createReadStream() {
        let keys = this.keys;
        let values = keys.map(key => this.merkle.get(key).value);
        let i;
        let val;
        let buf;
        let result = [];
        for (i in values) {
            val = values[i];
            if (val == null) {
                keys.splice(Number(i), 1);
            }
            else {
                buf = val;
                result.push(buf);
            }
        }
        const stream = new db_test_1.ReadableStream(keys, result);
        return stream;
    }
}
describe('Trie', () => {
    const merkle = new Merkle();
    const trie = new merkle_patricia_1.Trie(merkle);
    const alice = "123456";
    const state1 = { nonce: 10, owner: alice, amount: 100 };
    const bob = "789876";
    const state2 = { nonce: 20, owner: bob, amount: 200 };
    it("test get, put and del", async () => {
        await trie.put(alice, state1);
        assert.deepEqual(await trie.get(alice), state1, 'error in get and put funcs');
        await trie.delete(alice);
        assert.equal(await trie.get(alice), null, "error in del funcs");
    });
    it("test createReadstream", async () => {
        await trie.put(alice, state1);
        await trie.put(bob, state2);
        const all = await trie.filter();
        const expected = [state1, state2];
        assert.deepEqual(all, expected, "error in createReadstream func");
    });
});
