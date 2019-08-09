"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("../util"));
const constant_1 = require("../constant");
const big_integer_1 = __importDefault(require("big-integer"));
exports.native_prove = (bases, base_state, input_data) => {
    const native = constant_1.constant.native;
    const type = input_data[0];
    switch (type) {
        case "00":
            const remiter = bases[0];
            const remiter_state = base_state[0];
            const receivers = bases;
            const amounts = input_data.slice(1);
            const sum = amounts.reduce((s, a) => big_integer_1.default(a, 16).add(s), big_integer_1.default(0));
            const fee = big_integer_1.default(remiter_state.data[0] || "00", 16);
            const gas = big_integer_1.default(remiter_state.data[1] || "00", 16);
            const income = big_integer_1.default(remiter_state.data[2] || "00", 16);
            if (big_integer_1.default(remiter_state.amount, 16).subtract(sum).subtract(fee).subtract(gas).subtract(income).lesser(0) || receivers.length != amounts.length)
                return base_state;
            const remited = base_state.map(s => {
                if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(native, 16)) || s.owner != remiter)
                    return s;
                return _.new_obj(s, (s) => {
                    s.nonce = _.bigInt2hex(big_integer_1.default(s.nonce, 16).add(1));
                    s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).subtract(sum));
                    return s;
                });
            });
            const recieved = remited.map(s => {
                const index = receivers.indexOf(s.owner);
                if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(native, 16)) || index === -1)
                    return s;
                return _.new_obj(s, s => {
                    s.nonce = _.bigInt2hex(big_integer_1.default(s.nonce, 16).add(1));
                    s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).add(big_integer_1.default(amounts[index], 16)));
                    return s;
                });
            });
            const sub_income = recieved.map(s => {
                if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(native, 16)))
                    return s;
                const income = big_integer_1.default(s.data[2] || "00", 16);
                return _.new_obj(s, s => {
                    s.nonce = _.bigInt2hex(big_integer_1.default(s.nonce, 16).add(1));
                    s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).subtract(income));
                    return s;
                });
            });
            return sub_income;
        default: return base_state;
    }
};
exports.native_verify = (bases, base_state, input_data, output_state) => {
    const native = constant_1.constant.native;
    const type = input_data[0];
    switch (type) {
        case "00":
            const remiter = bases[0];
            const remiter_state = base_state[0];
            const receivers = bases;
            const amounts = input_data.slice(1);
            const sum = amounts.reduce((s, a) => big_integer_1.default(a, 16).add(s), big_integer_1.default(0));
            const fee = big_integer_1.default(remiter_state.data[0] || "00", 16);
            const gas = big_integer_1.default(remiter_state.data[1] || "00", 16);
            if (big_integer_1.default(remiter_state.amount, 16).subtract(sum).subtract(fee).subtract(gas).lesser(0) || receivers.length != amounts.length)
                return false;
            const amount_check = base_state.some((s, i) => {
                const index = receivers.indexOf(s.owner);
                if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(native, 16)) || index === -1)
                    return false;
                const income = big_integer_1.default(s.data[2] || "00", 16);
                const output = output_state[i];
                return big_integer_1.default(output.nonce, 16).lesser(big_integer_1.default(s.nonce, 16)) || s.owner != output.owner || big_integer_1.default(s.amount, 16).subtract(income).subtract(sum).add(big_integer_1.default(amounts[index], 16)).notEquals(big_integer_1.default(output.amount, 16));
            });
            if (amount_check)
                return false;
            return true;
        default: return false;
    }
};
