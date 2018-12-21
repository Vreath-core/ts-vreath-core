let my_version = 0;
let my_net_id = 1;
let my_chain_id = 1;
let compatible_version = 0;

type Config = {
    my_version:number,
    my_net_id:number,
    my_chain_id:number,
    compatible_version:number
}

export const constant = {
    my_version:my_version,
    my_net_id:my_net_id,
    my_chain_id:my_chain_id,
    native:"native",
    unit:"unit",
    token_name_maxsize:256,
    block_time:1000,
    max_blocks:60,
    block_size:10000000,
    all_issue:Math.pow(10,8),
    cycle:126144000,
    gas_limit:25,
    rate:0.99,
    pow_target:Math.pow(2,256),
    def_pos_diff:Math.pow(10,-30),
    compatible_version:compatible_version
}

export const change_config = (config:Config) => {
    my_version = config.my_version;
    my_net_id = config.my_net_id;
    my_chain_id = config.my_chain_id;
    compatible_version = config.compatible_version;
}