"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("./util"));
const crypto_set = __importStar(require("./crypto_set"));
class Lock {
    constructor(_address = new crypto_set.Addrees(), _state = 0, _height = new _.Counter(), _block_hash = new crypto_set.Hash(), _index = new _.Uint(), _tx_hash = new crypto_set.Hash()) {
        this.address = _address;
        this.state = _state;
        this.height = _height;
        this.block_hash = _block_hash;
        this.index = _index;
        this.tx_hash = _tx_hash;
    }
}
exports.Lock = Lock;
