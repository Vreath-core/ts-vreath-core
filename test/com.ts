import levelup, { LevelUp } from 'levelup';
import {DB, db_able} from '../src/db'
import memdown from 'memdown'


export class leveldb {
    private db:LevelUp<memdown<Buffer,Buffer>>;
    constructor(_db:LevelUp<memdown<Buffer,Buffer>>){
        this.db = _db;
    }

    public async get(key:Buffer):Promise<Buffer>{
        const got:Buffer|string = await this.db.get(key);
        if(typeof got ==='string') return Buffer.from(key);
        else return got;
    }

    public async put(key:Buffer,val:Buffer):Promise<void>{
        await this.db.put(key,val);
    }

    public async del(key:Buffer):Promise<void>{
        await this.db.del(key);
    }

    public createReadStream():NodeJS.ReadableStream{
        return this.db.createReadStream();
    }

    get raw_db(){
        return this.db;
    }
}


export const make_db_obj = ()=>{
    const levelup_obj = new levelup(memdown<Buffer,Buffer>());
    const leveldb_obj:db_able = new leveldb(levelup_obj);
    return new DB(leveldb_obj)
}
