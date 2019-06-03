import * as Err from './error'
import {Result} from './result'
import * as _ from './util'
import * as P from 'p-iteration'
const streamToPromise = require('stream-to-promise');

export type encode = "utf8" | "hex" | "ascii" | "base64";

export interface db_able {
    get(key:Buffer):Promise<Buffer>;
    put(key:Buffer,val:Buffer):Promise<void>;
    del(key:Buffer):Promise<void>;
    createReadStream():void;
}

export interface IDBRepository {
  readonly db:db_able;

  get(key:string,key_encode:encode,val_encode:encode):Promise<Result<string|null,Err.DBError>>

  put(key:string,val:string,key_encode:encode,val_encode:encode):Promise<Result<_.Bit,Err.DBError>>

  del(key:string,key_encode:encode):Promise<Result<_.Bit,Err.DBError>>

  read_obj<T>(key:string):Promise<Result<T|null,Err.DBError>>

  write_obj<T>(key:string,obj:T):Promise<Result<_.Bit,Err.DBError>>

  filter<T>(key_encode:encode,val_encode:encode,check:(key:string,value:T)=>Promise<boolean>|boolean):Promise<Result<T[],Err.DBError>>

}


export class DB implements IDBRepository {
    readonly db:db_able;
    constructor(_db:db_able){
        this.db = _db;
    }

    public async get(key:string,key_encode:encode='hex',val_encode:encode='utf8'):Promise<Result<string|null,Err.DBError>>{
        try{
            const got = await this.db.get(Buffer.from(key,key_encode));
            if(got==null) return new Result(null,new Err.DBError("got null data from database"));
            else return new Result(got.toString(val_encode));
        }
        catch(e){
            return new Result(null,new Err.DBError(e));
        }
    }

    public async put(key:string,val:string,key_encode:encode='hex',val_encode:encode='utf8'):Promise<Result<_.Bit,Err.DBError>>{
        try{
            await this.db.put(Buffer.from(key,key_encode),Buffer.from(val,val_encode));
            return new Result(1);
        }
        catch(e){
            return new Result(0,new Err.DBError(e));
        }
    }

    public async del(key:string,key_encode:encode='hex'):Promise<Result<_.Bit,Err.DBError>>{
        try{
            await this.db.del(Buffer.from(key,key_encode));
            return new Result(1);
        }
        catch(e){
            return new Result(0,new Err.DBError(e));
        }
    }

    public async read_obj<T>(key:string):Promise<Result<T|null,Err.DBError>>{
        try{
            const read = await this.get(key);
            if(read.err) return new Result(null,read.err);
            if(read.ok==null) return new Result(null,new Err.DBError("got null object from database"));
            const parsed:T = JSON.parse(read.ok);
            return new Result(parsed);
        }
        catch(e){
            return new Result(null, new Err.DBError(e));
        }
    }

    public async write_obj<T>(key:string,obj:T):Promise<Result<_.Bit,Err.DBError>>{
        try{
            await this.put(key,JSON.stringify(obj));
            return new Result(1);
        }
        catch(e){
            return new Result(0,new Err.DBError(e));
        }
    }

    public async filter<T>(key_encode:encode='hex',val_encode:encode='utf8',check:(key:string,value:T)=>Promise<boolean>|boolean=(key:string,value:T)=>true):Promise<Result<T[],Err.DBError>>{
        try{
            let result:T[] = [];
            const stream = this.db.createReadStream();
            const data_array:{key:Buffer,value:Buffer}[] = await streamToPromise(stream);
            await P.forEach(data_array, async (data)=>{
                const key = data.key.toString(key_encode);
                const value:T = JSON.parse(data.value.toString(val_encode));
                if(await check(key,value)) result.push(value);
            });
            return new Result(result);
        }
        catch(e){
            return new Result([],new Err.DBError(e));
        }
    }
}
