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
const constant_1 = require("./constant");
const tx_set = __importStar(require("./tx"));
exports.get_info_from_unit = async (unit, block_db) => {
    const ref_block = await block_db.read_obj(unit[0]);
    if (ref_block == null)
        throw new Error("ref_block doesn't exist");
    const ref_tx = ref_block.txs[unit[1]];
    if (ref_tx == null)
        throw new Error("ref_tx doesn't exist");
    const height = ref_tx.meta.refresh.height || "00";
    const req_block = await block_db.read_obj(height);
    if (req_block == null)
        throw new Error("req_block doesn't exist");
    const req_tx = req_block.txs[ref_tx.meta.refresh.index];
    if (req_tx == null)
        throw new Error("req_tx doesn't exist");
    const output_hash = _.array2hash(ref_tx.meta.refresh.output);
    const iden = _.array2hash([req_tx.hash, height, req_block.hash, unit[3], output_hash]);
    const unit_address = ("0000000000000000" + constant_1.constant.unit).slice(-16) + ("0000000000000000000000000000000000000000000000000000000000000000" + iden).slice(-64);
    const hash = await tx_set.unit_hash(req_tx.hash, req_block.hash, height, unit[2], unit[3], output_hash, unit[4]);
    return [iden, unit_address, hash];
};
