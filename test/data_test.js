"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const data_set = __importStar(require("../src/data"));
const com_1 = require("./com");
describe("data_set", () => {
    const db = com_1.make_db_obj();
    const trie = data_set.trie_ins(db);
    const alice = "123456";
    const state1 = { nonce: 10, owner: alice, amount: 100 };
    it("trie_ins", async () => {
        await trie.put(alice, state1);
        assert.deepEqual(await trie.get(alice), state1, 'error in get and put funcs');
        await trie.delete(alice);
        assert.equal(await trie.get(alice), null, "error in del funcs");
    });
});
