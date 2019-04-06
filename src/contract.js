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
const _ = __importStar(require("./util"));
const crypto_set = __importStar(require("./crypto_set"));
const tx_set = __importStar(require("./tx"));
const constant_1 = require("./constant");
const big_integer_1 = __importDefault(require("big-integer"));
const P = __importStar(require("p-iteration"));
exports.native_prove = (bases, base_state, input_data) => {
    const native = constant_1.constant.native;
    const type = input_data[0];
    switch (type) {
        case "0x0":
            const remiter = bases[0];
            const remiter_state = base_state[0];
            const receivers = bases;
            const amounts = input_data.slice(1);
            const sum = amounts.reduce((s, a) => big_integer_1.default(a).add(s), big_integer_1.default(0));
            const fee = big_integer_1.default(remiter_state.data[0] || "0x0");
            const gas = big_integer_1.default(remiter_state.data[1] || "0x0");
            const income = big_integer_1.default(remiter_state.data[2] || "0x0");
            if (big_integer_1.default(remiter_state.amount).subtract(sum).subtract(fee).subtract(gas).subtract(income).lesser(0) || receivers.length != amounts.length)
                return base_state;
            const remited = base_state.map(s => {
                if (s.token != native || s.owner != remiter)
                    return s;
                const income = big_integer_1.default(s.data[2] || "0x0");
                return _.new_obj(s, (s) => {
                    s.nonce = '0x' + big_integer_1.default(s.nonce).add(1).toString(16);
                    s.amount = '0x' + big_integer_1.default(s.amount).subtract(income).subtract(sum).toString(16);
                    return s;
                });
            });
            const recieved = remited.map(s => {
                const index = receivers.indexOf(s.owner);
                if (s.token != native || index === -1)
                    return s;
                const income = big_integer_1.default(s.data[2] || "0x0");
                return _.new_obj(s, s => {
                    s.nonce = '0x' + big_integer_1.default(s.nonce).add(1).toString(16);
                    s.amount = '0x' + big_integer_1.default(s.amount).subtract(income).subtract(amounts[index]).toString(16);
                    return s;
                });
            });
            return recieved;
        default: return base_state;
    }
};
exports.native_verify = (bases, base_state, input_data, output_state) => {
    const native = constant_1.constant.native;
    const type = input_data[0];
    switch (type) {
        case "0x0":
            const remiter = bases[0];
            const remiter_state = base_state[0];
            const receivers = bases;
            const amounts = input_data.slice(1);
            const sum = amounts.reduce((s, a) => big_integer_1.default(a).add(s), big_integer_1.default(0));
            const fee = big_integer_1.default(remiter_state.data[0] || "0x0");
            const gas = big_integer_1.default(remiter_state.data[1] || "0x0");
            if (big_integer_1.default(remiter_state.amount).subtract(sum).subtract(fee).subtract(gas).lesser(0) || receivers.length != amounts.length)
                return false;
            const remited = base_state.some((s, i) => {
                if (s.token != native || s.owner != remiter)
                    return false;
                const income = big_integer_1.default(s.data[2] || "0x0");
                const output = output_state[i];
                return big_integer_1.default(output.nonce).subtract(s.nonce).notEquals(1) || s.owner != output.owner || big_integer_1.default(s.amount).subtract(income).subtract(sum).notEquals(output.amount);
            });
            if (remited)
                return false;
            const recieved = base_state.map((s, i) => {
                const index = receivers.indexOf(s.owner);
                if (s.token != native || index === -1)
                    return false;
                const income = big_integer_1.default(s.data[2] || "0x0");
                const output = output_state[i];
                return big_integer_1.default(output.nonce).subtract(s.nonce).notEquals(1) || s.owner != output.owner || big_integer_1.default(s.amount).subtract(income).add(amounts[index]).notEquals(output.amount);
            });
            if (recieved)
                return false;
            return true;
        default: return false;
    }
};
exports.unit_prove = async (bases, base_state, input_data, block_db, last_height) => {
    const unit_base = bases.filter(str => '0x' + _.slice_token_part(str) === constant_1.constant.unit);
    const native_base = bases.filter(str => '0x' + _.slice_token_part(str) === constant_1.constant.native);
    const unit_states = base_state.filter(s => s.token === constant_1.constant.unit);
    const units = input_data.slice(1).reduce((res, val, i, array) => {
        if (i % 5 === 0) {
            const unit = [array[i], Number(array[i + 1]), array[i + 2], array[i + 3], array[i + 4]];
            res.push(unit);
        }
        return res;
    }, []);
    const unit_miners = units.map(u => u[3]).filter((val, i, array) => array.indexOf(val) === i);
    const type = input_data[0];
    switch (type) {
        case "0x0":
            const unit_validator = unit_base[0];
            const native_validator = native_base[0];
            const unit_base_hash_parts = unit_base.map(add => _.slice_hash_part(add));
            const native_base_hash_parts = native_base.map(add => _.slice_hash_part(add));
            if (unit_base.length != units.length + 1 || _.slice_hash_part(unit_validator) != _.slice_hash_part(native_validator) || unit_miners.some(add => '0x' + _.slice_token_part(add) != constant_1.constant.unit || native_base_hash_parts.slice(1).indexOf(_.slice_hash_part(add)) === -1))
                return base_state;
            const unit_verify = P.some(units, async (unit, i) => {
                const ref_block = await block_db.read_obj(unit[0]);
                if (ref_block == null)
                    return true;
                const ref_tx = ref_block.txs[unit[1]];
                if (ref_tx == null)
                    return true;
                const height = ref_tx.meta.refresh.height || "0x0";
                const req_block = await block_db.read_obj(height);
                if (req_block == null)
                    return true;
                const req_tx = req_block.txs[ref_tx.meta.refresh.index];
                if (req_tx == null)
                    return true;
                const output_hash = crypto_set.get_sha256(_.hex_sum(ref_tx.meta.refresh.output));
                const iden = await crypto_set.get_sha256(_.hex_sum([req_tx.hash, height, req_block.hash, unit[3], output_hash]));
                const hash = await tx_set.unit_hash(req_tx.hash, height, req_block.hash, unit[2], unit[3], output_hash, unit[4]);
                return !big_integer_1.default(hash).lesserOrEquals(constant_1.constant.pow_target) || '0x' + unit_base_hash_parts[i + 1] != iden || unit_states[i].data.length != 0;
            });
            if (unit_verify)
                return base_state;
            const unit_price_map = units.reduce((res, unit) => {
                const hash = _.slice_hash_part(unit[3]);
                if (res[hash] == null) {
                    res[hash] = big_integer_1.default(unit[4]);
                    return res;
                }
                else {
                    res[hash] = big_integer_1.default(res[hash]).add(unit[4]);
                    return res;
                }
            }, {});
            const unit_sum = units.length;
            const unit_bought = base_state.map(s => {
                if (s.token != constant_1.constant.unit || s.owner != unit_base[0])
                    return s;
                const flag = s.data[0];
                if (flag === "0x0")
                    return s;
                const pre_height = s.data[1];
                const reduce = big_integer_1.default(last_height).subtract(pre_height);
                const amount = (() => {
                    const computed = (big_integer_1.default(s.amount).add(unit_sum)).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
                    if (computed.lesser(1))
                        return big_integer_1.default("0x0");
                    else
                        return computed;
                })();
                return _.new_obj(s, s => {
                    s.nonce = '0x' + big_integer_1.default(s.nonce).add(1).toString(16);
                    s.amount = '0x' + amount.toString(16);
                    s.data[0] = "0x1";
                    s.data[1] = last_height;
                    return s;
                });
            });
            const unit_used = unit_bought.map(s => {
                if (s.token != constant_1.constant.unit || unit_base.slice(1).indexOf(s.owner) === -1)
                    return s;
                return _.new_obj(s, s => {
                    s.nonce = '0x' + big_integer_1.default(s.nonce).add(1).toString(16);
                    s.data[0] = "0x0";
                    s.data[1] = last_height;
                    return s;
                });
            });
            const native_states = unit_used.filter(s => s.token === constant_1.constant.native);
            const native_input = native_base_hash_parts.map(key => unit_price_map[key] || big_integer_1.default(0)).map(big => '0x' + big.toString(16));
            const paid = exports.native_prove(native_base, native_states, native_input);
            const result = unit_used.map(state => {
                if (state.token === constant_1.constant.native)
                    return paid.filter(s => s.token === constant_1.constant.native && s.owner === state.owner)[0];
                else
                    return state;
            });
            return result;
        default: return base_state;
    }
};
exports.unit_verify = async (bases, base_state, input_data, output_state, block_db, last_height) => {
    const unit_base = bases.filter(str => '0x' + _.slice_token_part(str) === constant_1.constant.unit);
    const native_base = bases.filter(str => '0x' + _.slice_token_part(str) === constant_1.constant.native);
    const unit_states = base_state.filter(s => s.token === constant_1.constant.unit);
    const units = input_data.slice(1).reduce((res, val, i, array) => {
        if (i % 5 === 0) {
            const unit = [array[i], Number(array[i + 1]), array[i + 2], array[i + 3], array[i + 4]];
            res.push(unit);
        }
        return res;
    }, []);
    const unit_miners = units.map(u => u[3]).filter((val, i, array) => array.indexOf(val) === i);
    const type = input_data[0];
    switch (type) {
        case "0x0":
            const unit_validator = unit_base[0];
            const native_validator = native_base[0];
            const unit_base_hash_parts = unit_base.map(add => _.slice_hash_part(add));
            const native_base_hash_parts = native_base.map(add => _.slice_hash_part(add));
            if (unit_base.length != units.length + 1 || _.slice_hash_part(unit_validator) != _.slice_hash_part(native_validator) || unit_miners.some(add => '0x' + _.slice_token_part(add) != constant_1.constant.unit || native_base_hash_parts.slice(1).indexOf(_.slice_hash_part(add)) === -1))
                return false;
            const unit_verify = P.some(units, async (unit, i) => {
                const ref_block = await block_db.read_obj(unit[0]);
                if (ref_block == null)
                    return true;
                const ref_tx = ref_block.txs[unit[1]];
                if (ref_tx == null)
                    return true;
                const height = ref_tx.meta.refresh.height || "0x0";
                const req_block = await block_db.read_obj(height);
                if (req_block == null)
                    return true;
                const req_tx = req_block.txs[ref_tx.meta.refresh.index];
                if (req_tx == null)
                    return true;
                const output_hash = crypto_set.get_sha256(_.hex_sum(ref_tx.meta.refresh.output));
                const iden = await crypto_set.get_sha256(_.hex_sum([req_tx.hash, height, req_block.hash, unit[3], output_hash]));
                const hash = await tx_set.unit_hash(req_tx.hash, height, req_block.hash, unit[2], unit[3], output_hash, unit[4]);
                return !big_integer_1.default(hash).lesserOrEquals(constant_1.constant.pow_target) || '0x' + unit_base_hash_parts[i + 1] != iden || unit_states[i].data.length != 0;
            });
            if (unit_verify)
                return false;
            const unit_price_map = units.reduce((res, unit) => {
                const hash = _.slice_hash_part(unit[3]);
                if (res[hash] == null) {
                    res[hash] = big_integer_1.default(unit[4]);
                    return res;
                }
                else {
                    res[hash] = big_integer_1.default(res[hash]).add(unit[4]);
                    return res;
                }
            }, {});
            const unit_sum = units.length;
            const unit_bought = base_state.some((s, i) => {
                if (s.token != constant_1.constant.unit || s.owner != unit_base[0])
                    return false;
                const output = output_state[i];
                const pre_flag = s.data[0];
                const new_flag = output.data[0];
                if (pre_flag === "0x0" || new_flag != "0x1")
                    return true;
                const pre_height = s.data[1];
                const reduce = big_integer_1.default(last_height).subtract(pre_height);
                const amount = (() => {
                    const computed = (big_integer_1.default(s.amount).add(unit_sum)).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
                    if (computed.lesser(1))
                        return big_integer_1.default("0x0");
                    else
                        return computed;
                })();
                return big_integer_1.default(output.nonce).subtract(s.nonce).notEquals(1) || s.owner != output.owner || amount.notEquals(output.amount) || pre_flag === "0x0" || new_flag != "0x1" || output.data[1] != last_height || big_integer_1.default(output.data[1]).lesserOrEquals(s.data[1]);
            });
            if (unit_bought)
                return false;
            const unit_used = base_state.some((s, i) => {
                if (s.token != constant_1.constant.unit || unit_base.slice(1).indexOf(s.owner) === -1)
                    return false;
                const output = output_state[i];
                return big_integer_1.default(output.nonce).subtract(s.nonce).notEquals(1) || s.owner != output.owner || s.data[0] != null || output.data[0] != "0x0" || output.data[1] != last_height || big_integer_1.default(output.data[1]).lesserOrEquals(s.data[1]);
            });
            if (unit_used)
                return false;
            const native_input = native_base_hash_parts.map(key => unit_price_map[key] || big_integer_1.default(0)).map(big => '0x' + big.toString(16));
            const native_base_states = base_state.filter(s => s.token === constant_1.constant.native);
            const native_output_states = output_state.filter(s => s.token === constant_1.constant.native);
            const paid = exports.native_verify(native_base, native_base_states, native_input, native_output_states);
            if (!paid)
                return false;
            return true;
        default: return false;
    }
};
exports.req_tx_change = (base_state, requester, fee, gas) => {
    const reqed = base_state.map(s => {
        if (s.owner != requester)
            return s;
        return _.new_obj(s, s => {
            if (s.data[0] == null)
                s.data[0] = "0x0";
            else
                s.data[0] = '0x' + big_integer_1.default(s.data[0]).add(fee).toString(16);
            s.data[1] = '0x' + big_integer_1.default(gas).toString(16);
            return s;
        });
    });
    const gained = reqed.map(s => {
        const income = big_integer_1.default(s.data[2] || "0x0");
        if (income.eq(0))
            return s;
        return _.new_obj(s, s => {
            s.data[2] = "0x0";
            return s;
        });
    });
    return gained;
};
//requester, refresher, bases
exports.ref_tx_change = async (bases, base_state, requester, refresher, fee, gas, last_height) => {
    const reqed = base_state.map(s => {
        if (s.owner != requester)
            return s;
        return _.new_obj(s, s => {
            s.data[1] = "0x0";
            s.amount = '0x' + big_integer_1.default(s.amount).subtract(gas).toString(16);
            return s;
        });
    });
    const refed = reqed.map(s => {
        if (s.owner != refresher)
            return s;
        return _.new_obj(s, s => {
            s.amount = '0x' + big_integer_1.default(s.amount).add(gas).toString(16);
            if (s.data[0] == null)
                s.data[0] = fee;
            else
                s.data[0] = '0x' + big_integer_1.default(s.data[0]).add(fee).toString(16);
            return s;
        });
    });
    const gained = refed.map(s => {
        const income = big_integer_1.default(s.data[2] || "0x0");
        if (income.eq(0))
            return s;
        return _.new_obj(s, s => {
            s.amount = '0x' + big_integer_1.default(s.amount).add(income).toString(16);
            s.data[2] = "0x0";
            return s;
        });
    });
    const reduced = gained.map(s => {
        if (s.token != constant_1.constant.unit || bases.indexOf(s.owner) === -1 || s.data[0] != "0x1")
            return s;
        const pre_height = s.data[1];
        const reduce = big_integer_1.default(last_height).subtract(pre_height);
        const amount = (() => {
            const computed = big_integer_1.default(s.amount).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("0x0");
            else
                return computed;
        })();
        return _.new_obj(s, s => {
            s.data[1] = last_height;
            s.amount = '0x' + amount.toString(16);
            return s;
        });
    });
    return reduced;
};
//native-requesters, native-refreshers, native-validator_1, native-validator_2, unit-validator_1, unit-validator_2
exports.key_block_change = (base_state, validator_1, validator_2, fee, last_height) => {
    const fee_1 = big_integer_1.default(fee).multiply(4).divide(10);
    const fee_2 = big_integer_1.default(fee).multiply(6).divide(10);
    const paid = base_state.map(s => {
        if (s.token != constant_1.constant.native)
            return s;
        const fee = big_integer_1.default(s.data[0] || "0x0");
        if (fee.eq(0))
            return s;
        return _.new_obj(s, s => {
            s.amount = '0x' + big_integer_1.default(s.amount).subtract(fee).toString(16);
            s.data[0] = "0x0";
            return s;
        });
    });
    const gained = paid.map(s => {
        const i = [validator_1, validator_2].indexOf(s.owner);
        if (s.token != constant_1.constant.native || i === -1)
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
            s.amount = '0x' + big_integer_1.default(s.amount).add(gain).toString(16);
            s.data[2] = '0x' + big_integer_1.default(s.data[2] || "0x0").add(gain).toString(16);
            return s;
        });
    });
    const reduced = gained.map(s => {
        if (s.token != constant_1.constant.unit)
            return s;
        const pre_height = s.data[1];
        const reduce = big_integer_1.default(last_height).subtract(pre_height);
        const amount = (() => {
            const computed = big_integer_1.default(s.amount).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("0x0");
            else
                return computed;
        })();
        return _.new_obj(s, s => {
            s.data[1] = last_height;
            s.amount = '0x' + amount.toString(16);
            return s;
        });
    });
    return reduced;
};
//unit-validator
exports.micro_block_change = (base_state, last_height) => {
    return base_state.map(s => {
        if (s.token != constant_1.constant.unit)
            return s;
        const pre_height = s.data[1];
        const reduce = big_integer_1.default(last_height).subtract(pre_height);
        const amount = (() => {
            const computed = big_integer_1.default(s.amount).multiply(big_integer_1.default(constant_1.constant.unit_rate).pow(reduce)).divide(big_integer_1.default(100).pow(reduce));
            if (computed.lesser(1))
                return big_integer_1.default("0x0");
            else
                return computed;
        })();
        return _.new_obj(s, s => {
            s.data[1] = last_height;
            s.amount = '0x' + amount.toString(16);
            return s;
        });
    });
};
