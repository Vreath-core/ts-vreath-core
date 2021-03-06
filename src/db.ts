import * as P from 'p-iteration'
import { Readable } from 'stream';
const streamToPromise = require('stream-to-promise');

type encode = "utf8" | "hex" | "ascii" | "base64";

export interface db_able {
    get(key:Buffer):Promise<Buffer|null>;
    put(key:Buffer,val:Buffer):Promise<void>;
    del(key:Buffer):Promise<void>;
    createReadStream():NodeJS.ReadableStream;
    raw_db?:any;
}

export class DB {
    private db:db_able;
    constructor(_db:db_able){
        this.db = _db;
    }

    public async get(key:string,key_encode:encode='hex',val_encode:encode='utf8'):Promise<string|null>{
        try{
            const buffer = await this.db.get(Buffer.from(key,key_encode));
            if(buffer==null) return null;
            return buffer.toString(val_encode);
        }
        catch(e){
            return null;
        }
    }

    public async put(key:string,val:string,key_encode:encode='hex',val_encode:encode='utf8'){
        await this.db.put(Buffer.from(key,key_encode),Buffer.from(val,val_encode));
    }

    public async del(key:string,key_encode:encode='hex'){
        await this.db.del(Buffer.from(key,key_encode));
    }

    public async read_obj<T>(key:string):Promise<T|null>{
        const read = await this.get(key);
        if(read==null) return null
        return JSON.parse(read);
    }

    public async write_obj<T>(key:string,obj:T){
        await this.put(key,JSON.stringify(obj));
    }

    public async filter<T>(key_encode:encode='hex',val_encode:encode='utf8',check:(key:string,value:T)=>Promise<boolean>|boolean=(key:string,value:T)=>true){
        let result:T[] = [];
        const stream = this.db.createReadStream();
        const data_array:{key:Buffer,value:Buffer}[] = await streamToPromise(stream);
        await P.forEach(data_array, async (data)=>{
            const key = data.key.toString(key_encode);
            const value:T = JSON.parse(data.value.toString(val_encode));
            if(await check(key,value)) result.push(value);
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

    get set_db():db_able{
        return this.db;
    }
}
