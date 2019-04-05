import levelup, { LevelUp } from 'levelup';
import leveldown, { LevelDown } from 'leveldown';

export class DB {
    private db:LevelUp<LevelDown>;
    constructor(root:string){
        this.db = levelup(leveldown(root));
    }

    public async get(key:string,encode:string='utf8'):Promise<string>{
        const buffer = await this.db.get(key);
        return buffer.toString(encode);
    }

    public async put(key:string,val:string,key_encode:string='hex',val_encode='utf8'){
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
}
