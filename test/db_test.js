"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const stream_1 = require("stream");
class ReadableStream extends stream_1.Readable {
    constructor(keys, values) {
        super({ objectMode: true });
        this.keys = keys;
        this.values = values;
        this.i = 0;
    }
    _read() {
        if (this.i >= this.keys.length) {
            this.push(null);
        }
        else {
            const obj = { key: this.keys[this.i], value: this.values[this.i] };
            this.push(obj);
            this.i++;
        }
    }
}
exports.ReadableStream = ReadableStream;
class TestDB {
    constructor(keys, values) {
        this.keys = keys;
        this.values = values;
    }
    async get(key) {
        const i = this.keys.indexOf(key);
        return this.values[i];
    }
    async put(key, val) {
        const i = this.keys.indexOf(key);
        if (i === -1) {
            this.keys.push(key);
            this.values.push(val);
        }
        else {
            this.values[i] = val;
        }
    }
    async del(key) {
        const i = this.keys.indexOf(key);
        this.keys.splice(i, 1);
        this.values.splice(i, 1);
    }
    createReadStream() {
        const keys = this.keys;
        const values = this.values;
        const stream = new ReadableStream(keys, values);
        return stream;
    }
    get raw_db() {
        return this.keys;
    }
}
exports.TestDB = TestDB;
describe('DB', () => {
    const test_db = new TestDB([], []);
    const alice = Buffer.from('alice');
    const bob = Buffer.from('bob');
    it('test get, put and del', async () => {
        await test_db.put(alice, bob);
        assert.equal(await test_db.get(alice), bob, 'error in get and put funcs');
        await test_db.del(alice);
        assert.equal(await test_db.get(alice), null, "error in del funcs");
    });
    it('test createReadStream', async () => {
        const streamToPromise = require('stream-to-promise');
        const one = Buffer.from('1');
        const two = Buffer.from('2');
        await test_db.put(alice, one);
        await test_db.put(bob, two);
        const stream = test_db.createReadStream();
        const data_array = await streamToPromise(stream);
        const expected = [
            { key: alice, value: one },
            { key: bob, value: two }
        ];
        assert.deepEqual(data_array, expected, 'error in create_readstream');
    });
});
