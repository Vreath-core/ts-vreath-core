"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
/*import {db_able,DB} from '../src/db'
import {Readable} from 'stream'*/
const com_1 = require("./com");
/*export class ReadableStream extends Readable implements NodeJS.ReadableStream{
    private i:number = 0;
    constructor(private keys:Buffer[],private values:Buffer[]){
        super({objectMode:true});
    }
    _read(){
        if(this.i>=this.keys.length){
            this.push(null);
        }
        else{
            const obj = {key:this.keys[this.i],value:this.values[this.i]};
            this.push(obj);
            this.i ++;
        }
    }
}

export class TestDB implements db_able {
    constructor(private keys:Buffer[],private values:Buffer[]){}

    public async get(key:Buffer){
        const i = this.keys.indexOf(key);
        return this.values[i];
    }

    public async put(key:Buffer,val:Buffer){
        const i = this.keys.indexOf(key);
        if(i===-1){
            this.keys.push(key);
            this.values.push(val);
        }
        else{
            this.values[i] = val;
        }
    }

    public async del(key:Buffer){
        const i = this.keys.indexOf(key);
        this.keys.splice(i,1);
        this.values.splice(i,1);
    }

    public createReadStream(){
        const keys = this.keys;
        const values = this.values;
        const stream = new ReadableStream(keys,values);
        return stream;
    }

    get raw_db(){
        return this.keys;
    }
}*/
describe('DB', () => {
    const test_db = com_1.make_db_obj();
    const alice = Buffer.from('alice').toString('hex');
    const bob = Buffer.from('bob').toString('hex');
    it('test get, put and del', async () => {
        await test_db.put(alice, bob);
        assert.equal(await test_db.get(alice), bob, 'error in get and put funcs');
        await test_db.del(alice);
        assert.equal(await test_db.get(alice), null, "error in del funcs");
    });
    it('test createReadStream', async () => {
        const one = Buffer.from('1').toString('hex');
        const two = Buffer.from('2').toString('hex');
        await test_db.put(alice, one);
        await test_db.put(bob, two);
        const data_array = await test_db.filter();
        const expected = [one, two];
        assert.deepEqual(data_array, expected, 'error in create_readstream');
    });
});
