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
exports.req_tx_change = (base_state, requester, fee, gas) => {
    const reqed = base_state.map(s => {
        if (s.owner != requester)
            return s;
        return _.new_obj(s, s => {
            if (s.data[0] == null)
                s.data[0] = "00";
            else
                s.data[0] = _.bigInt2hex(big_integer_1.default(s.data[0], 16).add(big_integer_1.default(fee, 16)));
            s.data[1] = gas;
            return s;
        });
    });
    const gained = reqed.map(s => {
        const income = big_integer_1.default(s.data[2] || "00", 16);
        if (income.eq(0))
            return s;
        return _.new_obj(s, s => {
            s.data[2] = "00";
            return s;
        });
    });
    return gained;
};
//requester, refresher, bases
exports.ref_tx_change = (bases, base_state, requester, refresher, fee, gas, new_height, income_map) => {
    const reqed = base_state.map(s => {
        if (s.owner != requester)
            return s;
        return _.new_obj(s, s => {
            s.data[1] = "00";
            s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).subtract(big_integer_1.default(gas, 16)));
            return s;
        });
    });
    const refed = reqed.map(s => {
        if (s.owner != refresher)
            return s;
        return _.new_obj(s, s => {
            s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).add(big_integer_1.default(gas, 16)));
            if (s.data[0] == null)
                s.data[0] = fee;
            else
                s.data[0] = _.bigInt2hex(big_integer_1.default(s.data[0], 16).add(big_integer_1.default(fee, 16)));
            return s;
        });
    });
    const gained = refed.map(s => {
        const income = big_integer_1.default(s.data[2] || "00", 16).add(big_integer_1.default(income_map[s.owner] || "00", 16));
        if (income.eq(0))
            return s;
        return _.new_obj(s, s => {
            s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).add(income));
            s.data[2] = "00";
            return s;
        });
    });
    const reduced = gained.map(s => {
        if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(constant_1.constant.unit, 16)) || bases.indexOf(s.owner) === -1 || s.data[0] != "01")
            return s;
        const pre_height = s.data[1];
        const reduce = big_integer_1.default.max(big_integer_1.default(new_height, 16).subtract(big_integer_1.default(pre_height, 16)), big_integer_1.default(1));
        const amount = (() => {
            const computed = big_integer_1.default(s.amount, 16).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("00");
            else
                return computed;
        })();
        return _.new_obj(s, s => {
            s.data[1] = new_height;
            s.amount = _.bigInt2hex(amount);
            return s;
        });
    });
    return reduced;
};
//native-requesters, native-refreshers, native-validator_1, native-validator_2, unit-validator_1, unit-validator_2
exports.key_block_change = (base_state, validator_1, validator_2, fee, new_height, locks) => {
    const fee_1 = big_integer_1.default(fee, 16).multiply(4).divide(10);
    const fee_2 = big_integer_1.default(fee, 16).multiply(6).divide(10);
    const paid = base_state.map(s => {
        if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(constant_1.constant.native, 16)))
            return s;
        const fee = big_integer_1.default(s.data[0] || "00", 16);
        if (fee.eq(0))
            return s;
        return _.new_obj(s, s => {
            s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).subtract(fee));
            s.data[0] = "00";
            return s;
        });
    });
    const gained = paid.map(s => {
        const i = [validator_1, validator_2].indexOf(s.owner);
        if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(constant_1.constant.native, 16)) || i === -1)
            return s;
        const gain = (() => {
            if (i === 0)
                return fee_1;
            else if (i === 1)
                return fee_2;
            else
                return 0;
        })();
        return _.new_obj(s, s => {
            s.amount = _.bigInt2hex(big_integer_1.default(s.amount, 16).add(gain));
            s.data[2] = _.bigInt2hex(big_integer_1.default(s.data[2] || "00", 16).add(gain));
            return s;
        });
    });
    const lock_owners = locks.map(l => l.address);
    const reduced = gained.map(s => {
        const i = lock_owners.indexOf(s.owner);
        const lock = locks[i];
        if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(constant_1.constant.unit, 16)) || s.data[0] != "01" || lock.state === 1)
            return s;
        const pre_height = s.data[1];
        const reduce = big_integer_1.default.max(big_integer_1.default(new_height, 16).subtract(big_integer_1.default(pre_height, 16)), big_integer_1.default(1));
        const amount = (() => {
            const computed = big_integer_1.default(s.amount, 16).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("00");
            else
                return computed;
        })();
        return _.new_obj(s, s => {
            s.data[1] = new_height;
            s.amount = _.bigInt2hex(amount);
            return s;
        });
    });
    return reduced;
};
//unit-validator
exports.micro_block_change = (base_state, new_height, locks) => {
    const lock_owners = locks.map(l => l.address);
    return base_state.map(s => {
        const i = lock_owners.indexOf(s.owner);
        const lock = locks[i];
        if (big_integer_1.default(s.token, 16).notEquals(big_integer_1.default(constant_1.constant.unit, 16)) || s.data[0] != "01" || lock.state === 1)
            return s;
        const pre_height = s.data[1];
        const reduce = big_integer_1.default.max(big_integer_1.default(new_height, 16).subtract(big_integer_1.default(pre_height, 16)), big_integer_1.default(1));
        const amount = (() => {
            const computed = big_integer_1.default(s.amount, 16).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("00");
            else
                return computed;
        })();
        return _.new_obj(s, s => {
            s.data[1] = new_height;
            s.amount = _.bigInt2hex(amount);
            return s;
        });
    });
};
