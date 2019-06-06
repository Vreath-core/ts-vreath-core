import assert = require('assert');
import {db_able,DB} from '../src/db'
import {Readable} from 'stream'

export class ReadableStream extends Readable{
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
}


describe('DB',()=>{
    const test_db = new TestDB([],[]);
    const alice = Buffer.from('alice');
    const bob = Buffer.from('bob');
    it('test get, put and del',async ()=>{
        await test_db.put(alice,bob);
        assert.equal(await test_db.get(alice),bob,'error in get and put funcs');
        await test_db.del(alice);
        assert.equal(await test_db.get(alice),null,"error in del funcs");
    });
    it('test createReadStream',async ()=>{
        const streamToPromise = require('stream-to-promise');
        const one = Buffer.from('1');
        const two = Buffer.from('2');
        await test_db.put(alice,one);
        await test_db.put(bob,two);
        const stream = test_db.createReadStream();
        const data_array:{key:Buffer,value:Buffer}[] = await streamToPromise(stream);
        const expected = [
            {key:alice,value:one},
            {key:bob,value:two}
        ];
        assert.deepEqual(data_array,expected,'error in create_readstream');
    });
});