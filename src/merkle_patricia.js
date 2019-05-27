"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Merkle = require('merkle-patricia-tree/secure');
const rlp = __importStar(require("rlp"));
const util_1 = require("util");
exports.en_key = (key) => {
    const val = rlp.encode(key.to_str()).toString('hex');
};
exports.de_key = (key) => {
    const val = rlp.decode(Buffer.from(key.to_str(), 'hex')).toString('utf-8');
};
exports.en_value = (value) => {
    const val = rlp.encode(JSON.stringify(value)).toString('hex');
};
exports.de_value = (value) => {
    return JSON.parse(rlp.decode(Buffer.from(value, 'hex')).toString());
};
class Trie {
    constructor(db, root = "") {
        if (root === "")
            this.trie = new Merkle(db.db);
        else
            this.trie = new Merkle(db.db, Buffer.from(root, 'hex'));
    }
    async get(key) {
        const result = await util_1.promisify(this.trie.get).bind(this.trie)(key);
        if (result == null)
            return null;
        return JSON.parse(result);
    }
    async put(key, value) {
        await util_1.promisify(this.trie.put).bind(this.trie)(key, JSON.stringify(value));
    }
    async delete(key) {
        await util_1.promisify(this.trie.del).bind(this.trie)(key);
    }
    now_root() {
        return this.trie.root.toString("hex");
    }
    checkpoint() {
        this.trie.checkpoint();
    }
    async filter(check = (value) => true) {
        let result = [];
        const stream = this.trie.createReadStream();
        return new Promise((resolve, reject) => {
            try {
                stream.on('data', async (data) => {
                    if (data.value == null)
                        return result;
                    const value = JSON.parse(data.value.toString());
                    if (await check(value))
                        result.push(value);
                });
                stream.on('end', (data) => {
                    resolve(result);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    async checkRoot(root) {
        const result = await util_1.promisify(this.trie.checkRoot).bind(this.trie)(exports.en_key(root));
        if (result == null)
            return false;
        return result;
    }
}
exports.Trie = Trie;
