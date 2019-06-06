"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const P = __importStar(require("p-iteration"));
const streamToPromise = require('stream-to-promise');
class Trie {
    constructor(trie) {
        this.trie = trie;
    }
    async get(key) {
        //const result:string = await promisify(this.trie.get).bind(this.trie)(key);
        const result = await this.trie.get(Buffer.from(key, 'hex'));
        if (result == null)
            return null;
        return JSON.parse(result.toString('utf8'));
    }
    async put(key, value) {
        //await promisify(this.trie.put).bind(this.trie)(key,JSON.stringify(value));
        await this.trie.put(Buffer.from(key, 'hex'), Buffer.from(JSON.stringify(value), 'utf8'));
    }
    async delete(key) {
        //await promisify(this.trie.del).bind(this.trie)(key);
        await this.trie.del(Buffer.from(key, 'hex'));
    }
    now_root() {
        return this.trie.root.toString("hex");
    }
    async filter(check = (key, value) => true) {
        let result = [];
        const stream = this.trie.createReadStream();
        const data_array = await streamToPromise(stream);
        await P.forEach(data_array, async (data) => {
            const key = data.key.toString('hex');
            const value = JSON.parse(data.value.toString('utf8'));
            if (await check(key, value))
                result.push(value);
        });
        return result;
        /*return new Promise<T[]>((resolve,reject)=>{
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
        });*/
    }
}
exports.Trie = Trie;
