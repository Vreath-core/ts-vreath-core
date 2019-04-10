"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let my_version = 0;
let my_net_id = 75;
let my_chain_id = 75;
let compatible_version = 0;
exports.constant = {
    my_version: my_version,
    my_net_id: my_net_id,
    my_chain_id: my_chain_id,
    native: "1",
    unit: "2",
    token_name_maxsize: 256,
    block_time: 1,
    max_blocks: 59,
    block_size: 10 ** 6,
    all_issue: Math.pow(10, 8),
    cycle: 126144000,
    gas_limit: 25,
    pow_target: Math.pow(2, 256),
    def_pos_diff: 24,
    lwma_size: 8,
    unit_rate: 90,
    compatible_version: compatible_version
};
exports.change_config = (config) => {
    my_version = config.my_version;
    my_net_id = config.my_net_id;
    my_chain_id = config.my_chain_id;
    compatible_version = config.compatible_version;
};
