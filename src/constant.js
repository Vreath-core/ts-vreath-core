"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let my_version = "0000";
let my_net_id = "004b";
let my_chain_id = "004b";
let compatible_version = "0000";
exports.constant = {
    my_version: my_version,
    my_net_id: my_net_id,
    my_chain_id: my_chain_id,
    native: "01",
    unit: "02",
    block_time: 12,
    max_blocks: 9,
    block_size: 25000,
    all_issue: "d3c21bcecceda1000000",
    cycle: 126144000,
    pow_target: "010000000000000000000000000000000000000000000000000000000000000000",
    def_pos_diff: "246139ca8000",
    lwma_size: 8,
    unit_rate: 90,
    compatible_version: compatible_version,
    one_hex: "e8d4a51000"
};
exports.change_config = (config) => {
    exports.constant.my_version = config.my_version;
    exports.constant.my_net_id = config.my_net_id;
    exports.constant.my_chain_id = config.my_chain_id;
    exports.constant.compatible_version = config.compatible_version;
};
