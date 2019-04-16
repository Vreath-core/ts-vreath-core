import bigInt from 'big-integer'

let my_version = "0000";
let my_net_id = "004b";
let my_chain_id = "004b";
let compatible_version = "0000";

export type Config = {
    my_version:string,
    my_net_id:string,
    my_chain_id:string,
    compatible_version:string
}

export const constant = {
    my_version:my_version,
    my_net_id:my_net_id,
    my_chain_id:my_chain_id,
    native:"1",
    unit:"2",
    block_time:12,
    max_blocks:9,
    block_size:25000,
    all_issue:bigInt(10).pow(24).toString(16),
    cycle:126144000,
    pow_target:bigInt(2).pow(256).toString(16),
    def_pos_diff:24,
    lwma_size:8,
    unit_rate:90,
    compatible_version:compatible_version
}

export const change_config = (config:Config) => {
    my_version = config.my_version;
    my_net_id = config.my_net_id;
    my_chain_id = config.my_chain_id;
    compatible_version = config.compatible_version;
}