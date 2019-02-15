"use strict";
exports.__esModule = true;
var my_version = 0;
var my_net_id = 75;
var my_chain_id = 75;
var compatible_version = 0;
exports.constant = {
    my_version: my_version,
    my_net_id: my_net_id,
    my_chain_id: my_chain_id,
    native: "native",
    unit: "unit",
    token_name_maxsize: 256,
    block_time: 1,
    max_blocks: 59,
    block_size: Math.pow(10, 6),
    all_issue: Math.pow(10, 8),
    cycle: 126144000,
    gas_limit: 25,
    pow_target: Math.pow(2, 256),
    def_pos_diff: 0.1,
    lwma_size: 8,
    unit_rate: 0.99,
    compatible_version: compatible_version
};
exports.change_config = function (config) {
    my_version = config.my_version;
    my_net_id = config.my_net_id;
    my_chain_id = config.my_chain_id;
    compatible_version = config.compatible_version;
};
