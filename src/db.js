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
class DB {
    constructor(_db) {
        this.db = _db;
    }
    async get(key, key_encode = 'hex', val_encode = 'utf8') {
        try {
            const buffer = await this.db.get(Buffer.from(key, key_encode));
            return buffer.toString(val_encode);
        }
        catch (e) {
            return null;
        }
    }
    async put(key, val, key_encode = 'hex', val_encode = 'utf8') {
        await this.db.put(Buffer.from(key, key_encode), Buffer.from(val, val_encode));
    }
    async del(key, key_encode = 'hex') {
        await this.db.del(Buffer.from(key, key_encode));
    }
    async read_obj(key) {
        const read = await this.get(key);
        if (read == null)
            return null;
        return JSON.parse(read);
    }
    async write_obj(key, obj) {
        await this.put(key, JSON.stringify(obj));
    }
    async filter(key_encode = 'hex', val_encode = 'utf8', check = (key, value) => true) {
        let result = [];
        const stream = this.db.createReadStream();
        const data_array = await streamToPromise(stream);
        await P.forEach(data_array, async (data) => {
            const key = data.key.toString(key_encode);
            const value = JSON.parse(data.value.toString(val_encode));
            if (await check(key, value))
                result.push(value);
        });
        return result;
        /*return new Promise<T[]>((resolve,reject)=>{
            try{
              stream.on('data',async (data:{key:Buffer,value:Buffer})=>{
                if(data.key==null||data.value==null) return result;
                const key = data.key.toString(key_encode);
                const value:T = JSON.parse(data.value.toString(val_encode));
                if(await check(key,value)) result.push(value);
              });

              stream.on('end',(data:{key:string,value:any})=>{
                resolve(result);
              });
            }
            catch(e){reject(e)}
          });*/
    }
    get set_db() {
        return this.db;
    }
}
exports.DB = DB;
