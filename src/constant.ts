import bigInt from 'big-integer'
import * as _ from './util'

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

export let constant = {
    my_version:my_version,
    my_net_id:my_net_id,
    my_chain_id:my_chain_id,
    native:"01",
    unit:"02",
    block_time:12,
    max_blocks:9,
    block_size:25000,
    all_issue:_.bigInt2hex(bigInt(10).pow(24)),
    cycle:126144000,
    pow_target:_.bigInt2hex(bigInt(2).pow(256)),
    def_pos_diff:_.bigInt2hex(bigInt(24)),
    lwma_size:8,
    unit_rate:90,
    compatible_version:compatible_version,
    one_hex:"e8d4a51000"
}

export const change_config = (config:Config) => {
    constant.my_version = config.my_version;
    constant.my_net_id = config.my_net_id;
    constant.my_chain_id = config.my_chain_id;
    constant.compatible_version = config.compatible_version;
}