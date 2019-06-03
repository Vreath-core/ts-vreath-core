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
const result_1 = require("./result");
const Err = __importStar(require("./error"));
const crypto_set = __importStar(require("./crypto_set"));
class State {
    constructor(_nonce = new _.Counter(), _token = new _.TokenKey(), _owner = new crypto_set.Addrees(), _amount = new _.Amount(), _data = []) {
        this.nonce = _nonce;
        this.token = _token;
        this.owner = _owner;
        this.amount = _amount;
        this.data = _data;
    }
    verify() {
        if (this.owner.slice_token_part().eq(this.token))
            return new result_1.Result(true);
        else
            return new result_1.Result(false, new Err.StateError("invalid state"));
    }
}
exports.State = State;
class Token {
    constructor(_nonce = new _.Counter(), _name = new _.TokenKey(), _issued = new _.Amount(), _code = new crypto_set.Hash()) {
        this.nonce = _nonce;
        this.name = _name;
        this.issued = _issued;
        this.code = _code;
    }
}
exports.Token = Token;
