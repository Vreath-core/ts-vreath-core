import levelup, { LevelUp } from 'levelup';
import leveldown, { LevelDown } from 'leveldown';

type encode = "utf8" | "hex" | "ascii" | "base64";

export class DB {
    private db:LevelUp<LevelDown>;
    constructor(root:string){
        this.db = levelup(leveldown(root));
    }

    public async get(key:string,encode:string='utf8'):Promise<string>{
        const buffer = await this.db.get(key);
        return buffer.toString(encode);
    }

    public async put(key:string,val:string,key_encode:encode='hex',val_encode:encode='utf8'){
        await this.db.put(Buffer.from(key,key_encode),Buffer.from(val,val_encode));
    }

    public async del(key:string){
        await this.db.del(key);
    }

    public async read_obj<T>(key:string):Promise<T>{
        return JSON.parse(await this.get(key));
    }

    public async write_obj<T>(key:string,obj:T){
        await this.put(key,JSON.stringify(obj));
    }

    public async filter<T>(key_encode:encode='hex',val_encode:encode='utf8',check:(key:string,value:T)=>Promise<boolean>|boolean=(key:string,value:T)=>true){
        let result:T[] = [];
        const stream = this.db.createReadStream();
        return new Promise<T[]>((resolve,reject)=>{
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
          });
    }

    public leveldb(){
        return this.db;
    }
}
