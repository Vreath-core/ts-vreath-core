"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const merkle_patricia_tree_1 = __importDefault(require("merkle-patricia-tree"));
const rlp = __importStar(require("rlp"));
const es6_promise_1 = require("es6-promise");
const util_promisify_1 = __importDefault(require("util.promisify"));
exports.en_key = (key) => {
    return rlp.encode(key).toString('hex');
};
exports.de_key = (key) => {
    return rlp.decode(Buffer.from(key, 'hex')).toString('hex');
};
exports.en_value = (value) => {
    return rlp.encode(JSON.stringify(value)).toString('hex');
};
exports.de_value = (value) => {
    return JSON.parse(rlp.decode(Buffer.from(value, 'hex')).toString());
};
class Trie {
    constructor(db, root = "") {
        if (root == "")
            this.trie = new merkle_patricia_tree_1.default(db);
        else
            this.trie = new merkle_patricia_tree_1.default(db, Buffer.from(root, 'hex'));
    }
    async get(key) {
        const result = await util_promisify_1.default(this.trie.get).bind(this.trie)(exports.en_key(key));
        if (result == null)
            return null;
        return exports.de_value(result);
    }
    async put(key, value) {
        await util_promisify_1.default(this.trie.put).bind(this.trie)(exports.en_key(key), exports.en_value(value));
        return this.trie;
    }
    async delete(key) {
        await util_promisify_1.default(this.trie.del).bind(this.trie)(exports.en_key(key));
        return this.trie;
    }
    now_root() {
        return this.trie.root.toString("hex");
    }
    checkpoint() {
        this.trie.checkpoint();
        return this.trie;
    }
    async commit() {
        await util_promisify_1.default(this.trie.commit).bind(this.trie)();
        return this.trie;
    }
    async revert() {
        await util_promisify_1.default(this.trie.revert).bind(this.trie)();
        return this.trie;
    }
    async filter(check = (key, value) => { return true; }) {
        let result = {};
        const stream = this.trie.createReadStream();
        return new es6_promise_1.Promise((resolve, reject) => {
            try {
                stream.on('data', (data) => {
                    const key = exports.de_key(data.key);
                    const value = exports.de_value(data.value);
                    if (check(key, value))
                        result[key] = value;
                });
                stream.on('end', (val) => {
                    resolve(result);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    async checkRoot(root) {
        const result = await util_promisify_1.default(this.trie.checkRoot).bind(this.trie)(exports.en_key(root));
        if (result == null)
            return false;
        return result;
    }
}
exports.Trie = Trie;
