"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var con_1 = require("./src/con");
var CryptoSet = require("./src/crypto_set");
var _ = require("./src/basic");
var merkle_patricia_1 = require("./src/merkle_patricia");
var StateSet = require("./src/state");
var TxSet = require("./src/tx");
var BlockSet = require("./src/block");
var PoolSet = require("./src/tx_pool");
var math = require("mathjs");
math.config({
    number: 'BigNumber'
});
var private2public = function (private_key) {
    if (private_key == null || typeof private_key != 'string')
        throw new Error('private key must be string!');
    return CryptoSet.PublicFromPrivate(private_key);
};
var encrypt = function (data, private_key, public_key) {
    try {
        if (data == null || typeof data != 'string')
            throw new Error('data must be string!');
        else if (private_key == null || typeof private_key != 'string')
            throw new Error('private key must be string!');
        else if (public_key == null || typeof public_key != 'string')
            throw new Error('public key must be string!');
        return CryptoSet.EncryptData(data, private_key, public_key);
    }
    catch (e) {
        throw new Error(e);
    }
};
var decrypt = function (code, private_key, public_key) {
    try {
        if (code == null || typeof code != 'string')
            throw new Error('code must be string!');
        else if (private_key == null || typeof private_key != 'string')
            throw new Error('private key must be string!');
        else if (public_key == null || typeof public_key != 'string')
            throw new Error('public key must be string!');
        return CryptoSet.DecryptData(code, private_key, public_key);
    }
    catch (e) {
        throw new Error(e);
    }
};
var sign = function (data, private_key) {
    try {
        if (data == null || typeof data != 'string')
            throw new Error('data must be string!');
        else if (private_key == null || typeof private_key != 'string')
            throw new Error('private key must be string!');
        return CryptoSet.SignData(data, private_key);
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify = function (data, sign, public_key) {
    try {
        if (data == null || typeof data != 'string')
            throw new Error('data must be string!');
        else if (sign == null || typeof sign != 'string')
            throw new Error('sign must be string!');
        else if (public_key == null || typeof public_key != 'string')
            throw new Error('public key must be string!');
        return CryptoSet.verifyData(data, sign, public_key);
    }
    catch (e) {
        throw new Error(e);
    }
};
var genereate_address = function (token, public_key) {
    try {
        if (token == null || typeof token != 'string')
            throw new Error('token must be string!');
        else if (public_key == null || typeof public_key != 'string')
            throw new Error('public_key must be string!');
        else if (Buffer.from(token).length > con_1.constant.token_name_maxsize)
            throw new Error('too long token name!');
        return CryptoSet.GenereateAddress(token, public_key);
    }
    catch (e) {
        throw new Error(e);
    }
};
var hex2number = function (str) {
    try {
        if (str == null || typeof str != 'string')
            throw new Error('str must be string!');
        return _.Hex_to_Num(str);
    }
    catch (e) {
        throw new Error(e);
    }
};
var hash = function (data) {
    try {
        if (data == null || typeof data != 'string')
            throw new Error('data must be string!');
        return _.toHash(data);
    }
    catch (e) {
        throw new Error(e);
    }
};
var hash_number = function (data) {
    try {
        if (data == null || typeof data != 'string')
            throw new Error('data must be string!');
        return _.toHashNum(data);
    }
    catch (e) {
        throw new Error(e);
    }
};
var object_hash = function (obj) {
    try {
        JSON.stringify(obj, function (key, val) {
            if (val == null)
                throw new Error('null exists');
        });
        return _.ObjectHash(obj);
    }
    catch (e) {
        throw new Error(e);
    }
};
var object_hash_number = function (obj) {
    try {
        JSON.stringify(obj, function (key, val) {
            if (val == null)
                throw new Error('null exists');
        });
        return _.Hex_to_Num(_.ObjectHash(obj));
    }
    catch (e) {
        throw new Error(e);
    }
};
var merge_pub_keys = function (public_keys) {
    try {
        public_keys.forEach(function (pub) {
            if (pub == null || typeof pub != 'string')
                throw new Error('public key must be string!');
        });
        return _.reduce_pub(public_keys);
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_address = function (address) {
    try {
        if (address == null || typeof address != 'string')
            throw new Error('address must be string!');
        return _.address_form_check(address, con_1.constant.token_name_maxsize);
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_hash_size = function (hash) {
    try {
        return typeof hash != 'string' || _.hash_size_check(hash);
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.crypto = {
    genereate_key: CryptoSet.GenerateKeys,
    private2public: private2public,
    encrypt: encrypt,
    decrypt: decrypt,
    sign: sign,
    verify: verify,
    genereate_address: genereate_address,
    hex2number: hex2number,
    hash: hash,
    hash_number: hash_number,
    object_hash: object_hash,
    object_hash_number: object_hash_number,
    merge_pub_keys: merge_pub_keys,
    verify_address: verify_address,
    verify_hash_size: verify_hash_size
};
var change_configs = function (version, network_id, chain_id, compatible_version) {
    try {
        if (typeof version != 'number' || version < 0 || !Number.isInteger(version))
            throw new Error('invalid version');
        else if (typeof network_id != 'number' || network_id < 0 || !Number.isInteger(network_id))
            throw new Error('invalid network id');
        else if (typeof chain_id != 'number' || chain_id < 0 || !Number.isInteger(chain_id))
            throw new Error('invalid chain id');
        else if (typeof compatible_version != 'number' || compatible_version < 0 || !Number.isInteger(compatible_version))
            throw new Error('invalid compatible version');
        var config = {
            my_version: version,
            my_net_id: network_id,
            my_chain_id: chain_id,
            compatible_version: compatible_version
        };
        con_1.change_config(config);
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.con = {
    constant: con_1.constant,
    change_configs: change_configs
};
var trie = /** @class */ (function (_super) {
    __extends(trie, _super);
    function trie() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return trie;
}(merkle_patricia_1.Trie));
exports.trie = trie;
;
var isState = function (state) {
    return ['state', 'info'].indexOf(state.kind) != -1 && typeof state.nonce === 'number' && state.nonce >= 0 && Number.isInteger(state.nonce) && typeof state.token === 'string' && Buffer.from(state.token).length <= con_1.constant.token_name_maxsize && typeof state.owner === 'string' && ((state.kind === 'state' && !_.address_form_check(state.owner, con_1.constant.token_name_maxsize)) || (state.kind === 'info' && state.owner === '')) && typeof state.amount === 'number' && state.amount >= 0 && !Object.values(state.data).some(function (val) { return typeof val != 'string'; }) && typeof state.issued === 'number' && state.issued >= 0 && typeof state.code === 'string' && !_.hash_size_check(state.code);
};
var isLock = function (lock) {
    return typeof lock.address === 'string' && !_.address_form_check(lock.address, con_1.constant.token_name_maxsize) && ['yet', 'already'].indexOf(lock.state) != -1 && typeof lock.height === 'number' && lock.height >= 0 && Number.isInteger(lock.height) && typeof lock.block_hash === 'string' && !_.hash_size_check(lock.block_hash) && typeof lock.index === 'number' && lock.index >= 0 && Number.isInteger(lock.index) && typeof lock.tx_hash === 'string' && !_.hash_size_check(lock.tx_hash);
};
var create_state = function (nonce, owner, token, amount, data) {
    if (nonce === void 0) { nonce = 0; }
    if (owner === void 0) { owner = CryptoSet.GenereateAddress("", _.toHash("")); }
    if (token === void 0) { token = ""; }
    if (amount === void 0) { amount = 0; }
    if (data === void 0) { data = {}; }
    try {
        if (typeof nonce != 'number' || nonce < 0 || !Number.isInteger(nonce))
            throw new Error('invalid nonce');
        else if (typeof owner != 'string' || _.address_form_check(owner, con_1.constant.token_name_maxsize))
            throw new Error('invalid owner');
        else if (typeof token != 'string' || Buffer.from(token).length > con_1.constant.token_name_maxsize)
            throw new Error('invalid token');
        else if (typeof amount != 'number' || amount < 0)
            throw new Error('invalid amount');
        else if (Object.values(data).some(function (val) { return typeof val != 'string'; }))
            throw new Error('invalid data');
        var state_1 = StateSet.CreateState(nonce, owner, token, amount, data);
        if (!isState(state_1))
            throw new Error('invalid state');
        return state_1;
    }
    catch (e) {
        throw new Error(e);
    }
};
var create_info = function (nonce, token, issued, code) {
    if (nonce === void 0) { nonce = 0; }
    if (token === void 0) { token = ""; }
    if (issued === void 0) { issued = 0; }
    if (code === void 0) { code = _.toHash(''); }
    try {
        if (typeof nonce != 'number' || nonce < 0 || !Number.isInteger(nonce))
            throw new Error('invalid nonce');
        else if (typeof token != 'string' || Buffer.from(token).length > con_1.constant.token_name_maxsize)
            throw new Error('invalid token');
        else if (typeof issued != 'number' || issued < 0)
            throw new Error('invalid issued');
        else if (typeof code != 'string' || _.hash_size_check(code))
            throw new Error('invalid code');
        var info = StateSet.CreateInfo(nonce, token, issued, code);
        if (!isState(info))
            throw new Error('invalid info');
        return info;
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_state = function (state) {
    try {
        if (!isState(state))
            throw new Error('invalid state');
        return TxSet.state_check(state);
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.state = {
    isState: isState,
    isLock: isLock,
    create_state: create_state,
    create_info: create_info,
    verify_state: verify_state
};
var isTxMeta = function (meta) {
    return ['request', 'refresh'].indexOf(meta.kind) != -1 && ['change', 'create'].indexOf(meta.type) != -1 && typeof meta.version === 'number' && typeof meta.network_id === 'number' && typeof meta.chain_id === 'number' && typeof meta.timestamp === 'number' && typeof meta.address === 'string' && !_.address_form_check(meta.address, con_1.constant.token_name_maxsize) && !meta.pub_key.some(function (pub) { return typeof pub != 'string'; }) && typeof meta.feeprice === 'number' && meta.feeprice >= 0 && typeof meta.gas === 'number' && meta.gas >= 0 && !meta.tokens.some(function (t, i) { return typeof t != 'string' || Buffer.from(t).length > con_1.constant.token_name_maxsize || i >= 5; }) && !meta.bases.some(function (base) { return typeof base != 'string' || _.address_form_check(base, con_1.constant.token_name_maxsize); }) && typeof meta.input === 'string' && !_.hash_size_check(meta.input) && typeof meta.height === 'number' && meta.height >= 0 && Number.isInteger(meta.height) && typeof meta.block_hash === 'string' && !_.hash_size_check(meta.block_hash) && typeof meta.index === 'number' && meta.index >= 0 && Number.isInteger(meta.index) && typeof meta.req_tx_hash === 'string' && !_.hash_size_check(meta.req_tx_hash) && typeof meta.success === 'boolean' && typeof meta.output === 'string' && !_.hash_size_check(meta.output) && typeof meta.nonce === 'number' && meta.nonce >= 0 && Number.isInteger(meta.nonce) && typeof meta.unit_price === 'number' && meta.unit_price >= 0 && typeof meta.log_hash === 'string' && !_.hash_size_check(meta.log_hash);
};
var isTxRaw = function (raw) {
    return !raw.raw.some(function (raw) { return raw == null || typeof raw != 'string'; }) && !raw.signature.some(function (sign) { return sign == null || typeof sign != 'string'; }) && raw.log != null && typeof raw.log === 'string';
};
var isTxAdd = function (add) {
    return typeof add.height === 'number' && add.height >= 0 && Number.isInteger(add.height) && typeof add.hash === 'string' && !_.hash_size_check(add.hash) && typeof add.index === 'number' && add.index >= 0 && Number.isInteger(add.index);
};
var isTx = function (tx) {
    return typeof tx.hash === 'string' && !_.hash_size_check(tx.hash) && isTxMeta(tx.meta) && isTxRaw(tx.raw) && isTxAdd(tx.additional);
};
var isTxPure = function (tx) {
    return typeof tx.hash === 'string' && !_.hash_size_check(tx.hash) && isTxMeta(tx.meta) && isTxAdd(tx.additional);
};
var isBlockMeta = function (meta) {
    return ['key', 'micro'].indexOf(meta.kind) != -1 && typeof meta.version === 'number' && typeof meta.network_id === 'number' && typeof meta.chain_id === 'number' && typeof meta.validator === 'string' && typeof meta.height === 'number' && meta.height >= 0 && Number.isInteger(meta.height) && typeof meta.timestamp === 'number' && typeof meta.previoushash === 'string' && !_.hash_size_check(meta.previoushash) && typeof meta.pos_diff === 'number' && meta.pos_diff > 0 && !meta.validatorPub.some(function (pub) { return typeof pub != 'string'; }) && typeof meta.stateroot === 'string' && typeof meta.lockroot === 'string' && typeof meta.tx_root === 'string' && !_.hash_size_check(meta.tx_root) && typeof meta.fee_sum === 'number' && meta.fee_sum >= 0 && typeof meta.extra === 'string';
};
var isBlock = function (block) {
    return typeof block.hash === 'string' && !_.hash_size_check(block.hash) && isBlockMeta(block.meta) && !block.txs.some(function (tx) { return !isTxPure(tx); }) && !block.raws.some(function (raw) { return !isTxRaw(raw); }) && !block.validatorSign.some(function (sign) { return typeof sign != 'string'; });
};
var tx2pure = function (tx) {
    try {
        if (!isTx(tx))
            throw new Error('this is not tx');
        var pure = TxSet.tx_to_pure(tx);
        if (!isTxPure(pure))
            throw new Error('this is not tx pure');
        return pure;
    }
    catch (e) {
        throw new Error(e);
    }
};
var pure2tx = function (pure, block) {
    try {
        if (!isTxPure(pure))
            throw new Error('invalid tx pure');
        else if (!isBlock(block))
            throw new Error('invalid block');
        var tx_1 = TxSet.pure_to_tx(pure, block);
        if (!isTx(tx_1))
            throw new Error('invalid tx');
        return tx_1;
    }
    catch (e) {
        throw new Error(e);
    }
};
var get_tx_fee = function (tx) {
    try {
        if (!isTx(tx))
            throw new Error('this is not tx');
        return TxSet.tx_fee(tx);
    }
    catch (e) {
        throw new Error(e);
    }
};
var mining = function (request, height, block_hash, refresher, output, unit_price, nonce) {
    try {
        if (typeof request != 'string' || _.hash_size_check(request))
            throw new Error('invalid hash');
        else if (typeof height != 'number' || height < 0 || !Number.isInteger(height))
            throw new Error('invalid height');
        else if (typeof block_hash != 'string' || _.hash_size_check(block_hash))
            throw new Error('invalid block hash');
        else if (typeof refresher != 'string' || _.address_form_check(refresher, con_1.constant.token_name_maxsize))
            throw new Error('invalid refresher');
        else if (typeof output != 'string' || _.hash_size_check(output))
            throw new Error('invalid output');
        else if (typeof unit_price != 'number' || unit_price < 0)
            throw new Error('invalid unit price');
        else if (typeof nonce != 'number' || nonce < 0 || !Number.isInteger(nonce))
            throw new Error('invalid nonce');
        return math.smallerEq(TxSet.unit_hash(request, height, block_hash, nonce, refresher, output, unit_price), con_1.constant.pow_target);
    }
    catch (e) {
        throw new Error(e);
    }
};
var find_req_tx = function (ref_tx, chain) {
    try {
        if (!isTx(ref_tx) || ref_tx.meta.kind != 'refresh')
            throw new Error('invalid refresh tx');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        var req_tx = TxSet.find_req_tx(ref_tx, chain);
        if (!isTx(req_tx) || req_tx.meta.kind != 'request')
            throw new Error('invalid request tx');
        return req_tx;
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_req_tx = function (req_tx, request_mode, StateData, LockData) {
    try {
        if (!isTx(req_tx) || req_tx.meta.kind != 'request')
            throw new Error('invalid req_tx');
        else if (typeof request_mode != 'boolean')
            throw new Error('invalid request mode');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        return TxSet.ValidRequestTx(req_tx, request_mode, StateData, LockData);
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_ref_tx = function (ref_tx, chain, refresh_mode, StateData, LockData) {
    try {
        if (!isTx(ref_tx) || ref_tx.meta.kind != 'refresh')
            throw new Error('invalid ref_tx');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (typeof refresh_mode != 'boolean')
            throw new Error('invalid refresh mode');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        return TxSet.ValidRefreshTx(ref_tx, chain, refresh_mode, StateData, LockData);
    }
    catch (e) {
        throw new Error(e);
    }
};
var create_req_tx = function (pub_keys, type, tokens, bases, feeprice, gas, input_raw, log_raw, private_key, public_key) {
    try {
        if (pub_keys.some(function (key) { return typeof key != 'string'; }))
            throw new Error('invalid public keys');
        else if (["change", "create"].indexOf(type) === -1)
            throw new Error('invalid type');
        else if (tokens.some(function (t, i) { return typeof t != 'string' || Buffer.from(t).length > con_1.constant.token_name_maxsize || i >= 5; }))
            throw new Error('invalid tokens');
        else if (bases.some(function (b) { return typeof b != 'string' || _.address_form_check(b, con_1.constant.token_name_maxsize); }))
            throw new Error('invalid bases');
        else if (typeof feeprice != 'number' || feeprice < 0)
            throw new Error('invalid feeprice');
        else if (typeof gas != 'number' || gas < 0)
            throw new Error('invalid gas');
        else if (input_raw.some(function (raw) { return typeof raw != 'string'; }))
            throw new Error('invalid input_raw');
        else if (typeof log_raw != 'string')
            throw new Error('invalid log');
        var req_tx = TxSet.CreateRequestTx(pub_keys, type, tokens, bases, feeprice, gas, input_raw, log_raw);
        if (!isTx(req_tx) || req_tx.meta.kind != 'request')
            throw new Error('invalid req_tx');
        var signed = TxSet.SignTx(req_tx, private_key, public_key);
        return signed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var create_ref_tx = function (pub_keys, feeprice, unit_price, height, block_hash, index, req_tx_hash, success, nonce, output_raw, log_raw, private_key, public_key) {
    try {
        if (pub_keys.some(function (key) { return typeof key != 'string'; }))
            throw new Error('invalid public keys');
        else if (typeof feeprice != 'number' || feeprice < 0)
            throw new Error('invalid feeprice');
        else if (typeof unit_price != 'number' || unit_price < 0)
            throw new Error('invalid unit price');
        else if (typeof height != 'number' || height < 0 || !Number.isInteger(height))
            throw new Error('invalid height');
        else if (typeof block_hash != 'string' || _.hash_size_check(block_hash))
            throw new Error('invalid block hash');
        else if (typeof index != 'number' || index < 0 || !Number.isInteger(index))
            throw new Error('invalid index');
        else if (typeof req_tx_hash != 'string' || _.hash_size_check(req_tx_hash))
            throw new Error('invalid req tx');
        else if (typeof success != 'boolean')
            throw new Error('invalid success');
        else if (typeof nonce != 'number' || nonce < 0 || !Number.isInteger(nonce))
            throw new Error('invalid nonce');
        else if (output_raw.some(function (raw) { return typeof raw != 'string'; }))
            throw new Error('invalid output raw');
        else if (typeof log_raw != 'string')
            throw new Error('invalid log raw');
        var ref_tx = TxSet.CreateRefreshTx(pub_keys, feeprice, unit_price, height, block_hash, index, req_tx_hash, success, nonce, output_raw, log_raw);
        if (!isTx(ref_tx))
            throw new Error('invalid ref_tx');
        var signed = TxSet.SignTx(ref_tx, private_key, public_key);
        return signed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var sign_tx = function (tx, private_key, public_key) {
    try {
        if (!isTx(tx))
            throw new Error('invalid tx');
        else if (typeof private_key != 'string')
            throw new Error('invalid private key');
        else if (typeof public_key != 'string')
            throw new Error('invalid public key');
        var signed = TxSet.SignTx(tx, private_key, public_key);
        if (!isTx(signed))
            throw new Error('invalid signed tx');
        return signed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var accept_req_tx = function (req_tx, height, block_hash, index, StateData, LockData) {
    try {
        if (!isTx(req_tx) || req_tx.meta.kind != 'request')
            throw new Error('invalid req_tx');
        else if (typeof height != 'number' || height < 0 || !Number.isInteger(height))
            throw new Error('invalid height');
        else if (typeof block_hash != 'string' || _.hash_size_check(block_hash))
            throw new Error('invalid block hash');
        else if (typeof index != 'number' || index < 0 || !Number.isInteger(index))
            throw new Error('invalid index');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        var accepted = TxSet.AcceptRequestTx(req_tx, height, block_hash, index, StateData, LockData);
        if (accepted[0].some(function (s) { return !isState(s); }))
            throw new Error('invalid accepted state data');
        else if (accepted[1].some(function (l) { return !isLock(l); }))
            throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch (e) {
        throw new Error(e);
    }
};
var accept_ref_tx = function (ref_tx, chain, StateData, LockData) {
    try {
        if (!isTx(ref_tx) || ref_tx.meta.kind != 'refresh')
            throw new Error('invalid ref_tx');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        var accepted = TxSet.AcceptRefreshTx(ref_tx, chain, StateData, LockData);
        if (accepted[0].some(function (s) { return !isState(s); }))
            throw new Error('invalid accepted state data');
        else if (accepted[1].some(function (l) { return !isLock(l); }))
            throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch (e) {
        throw new Error(e);
    }
};
var native_contract = function (StateData, req_tx) {
    try {
        if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (!isTx(req_tx) || req_tx.meta.kind != 'request')
            throw new Error('invalid request tx');
        var refreshed = TxSet.native_code(StateData, req_tx);
        if (refreshed.some(function (s) { return !isState(s); }))
            throw new Error('invalid refreshed state data');
        return refreshed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var unit_contract = function (StateData, req_tx, chain) {
    try {
        if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (!isTx(req_tx) || req_tx.meta.kind != 'request')
            throw new Error('invalid request tx');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        var refreshed = TxSet.unit_code(StateData, req_tx, chain);
        if (refreshed.some(function (s) { return !isState(s); }))
            throw new Error('invalid refreshed state data');
        return refreshed;
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.tx = {
    empty_tx: TxSet.empty_tx(),
    isTx: isTx,
    isTxPure: isTxPure,
    isTxMeta: isTxMeta,
    isTxRaw: isTxRaw,
    isTxAdd: isTxAdd,
    tx2pure: tx2pure,
    pure2tx: pure2tx,
    get_tx_fee: get_tx_fee,
    mining: mining,
    find_req_tx: find_req_tx,
    verify_req_tx: verify_req_tx,
    verify_ref_tx: verify_ref_tx,
    create_req_tx: create_req_tx,
    create_ref_tx: create_ref_tx,
    sign_tx: sign_tx,
    accept_req_tx: accept_req_tx,
    accept_ref_tx: accept_ref_tx,
    native_contract: native_contract,
    unit_contract: unit_contract
};
var search_key_block = function (chain) {
    try {
        if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        var key_block = BlockSet.search_key_block(chain);
        if (!isBlock(key_block) || key_block.meta.kind != 'key')
            throw new Error('invalid key block');
        return key_block;
    }
    catch (e) {
        throw new Error(e);
    }
};
var search_micro_block = function (chain, key_block) {
    try {
        if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (!isBlock(key_block) || key_block.meta.kind != 'key')
            throw new Error('invalid key block');
        var micro_blocks = BlockSet.search_micro_block(chain, key_block);
        if (micro_blocks.some(function (b) { return !isBlock(b) || b.meta.kind != 'micro'; }))
            throw new Error('invalid micro blocks');
        return micro_blocks;
    }
    catch (e) {
        throw new Error(e);
    }
};
var get_tree_root = function (hashes) {
    try {
        if (hashes.some(function (hash) { return typeof hash != 'string' || _.hash_size_check(hash); }))
            throw new Error('hashes');
        var root = BlockSet.GetTreeroot(hashes)[0];
        if (typeof root != 'string' || _.hash_size_check(root))
            throw new Error('invalid root');
        return root;
    }
    catch (e) {
        throw new Error(e);
    }
};
var pos_staking = function (previoushash, timestamp, address, balance, difficulty) {
    try {
        if (typeof previoushash != 'string' || _.hash_size_check(previoushash))
            throw new Error('invalid previoushash');
        else if (typeof timestamp != 'number' || timestamp < 0)
            throw new Error('invalid timestamp');
        else if (typeof address != 'string' || _.address_form_check(address, con_1.constant.token_name_maxsize))
            throw new Error('invalid address');
        else if (typeof balance != 'number' || balance < 0)
            throw new Error('invalid balance');
        else if (typeof difficulty != 'number' || difficulty < 0)
            throw new Error('invalid difficulty');
        return math.chain(Math.pow(2, 256)).multiply(balance).divide(difficulty).largerEq(BlockSet.pos_hash(previoushash, address, timestamp)).done();
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_key_block = function (key_block, chain, right_stateroot, right_lockroot, StateData) {
    try {
        if (!isBlock(key_block) || key_block.meta.kind != 'key')
            throw new Error('invalid block');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (typeof right_stateroot != 'string')
            throw new Error('invalid stateroot');
        else if (typeof right_lockroot != 'string')
            throw new Error('invalid lockroot');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        return BlockSet.ValidKeyBlock(key_block, chain, right_stateroot, right_lockroot, StateData);
    }
    catch (e) {
        throw new Error(e);
    }
};
var verify_micro_block = function (micro_block, chain, right_stateroot, right_lockroot, StateData, LockData) {
    try {
        if (!isBlock(micro_block) || micro_block.meta.kind != 'micro')
            throw new Error('invalid block');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (typeof right_stateroot != 'string')
            throw new Error('invalid stateroot');
        else if (typeof right_lockroot != 'string')
            throw new Error('invalid lockroot');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        return BlockSet.ValidMicroBlock(micro_block, chain, right_stateroot, right_lockroot, StateData, LockData);
    }
    catch (e) {
        throw new Error(e);
    }
};
var create_key_block = function (chain, validatorPub, stateroot, lockroot, extra, private_key, public_key) {
    try {
        if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (validatorPub.some(function (pub) { return typeof pub != 'string'; }))
            throw new Error('invalid validator public keys');
        else if (typeof stateroot != 'string')
            throw new Error('invalid stateroot');
        else if (typeof lockroot != 'string')
            throw new Error('invalid lockroot');
        else if (typeof extra != 'string')
            throw new Error('invalid extra');
        var key_block = BlockSet.CreateKeyBlock(chain, validatorPub, stateroot, lockroot, extra);
        if (!isBlock(key_block) || key_block.meta.kind != 'key')
            throw new Error('invalid key block');
        var signed = BlockSet.SignBlock(key_block, key_block.meta.validatorPub, private_key, public_key);
        return signed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var create_micro_block = function (chain, stateroot, lockroot, txs, extra, private_key, public_key) {
    try {
        if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (typeof stateroot != 'string')
            throw new Error('invalid stateroot');
        else if (typeof lockroot != 'string')
            throw new Error('invalid lockroot');
        else if (txs.some(function (tx) { return !isTx(tx); }))
            throw new Error('invalid txs');
        else if (typeof extra != 'string')
            throw new Error('invalid extra');
        var micro_block = BlockSet.CreateMicroBlock(chain, stateroot, lockroot, txs, extra);
        if (!isBlock(micro_block) || micro_block.meta.kind != 'micro')
            throw new Error('invalid micro block');
        var pre_key_block = BlockSet.search_key_block(chain);
        if (!isBlock(pre_key_block) || pre_key_block.meta.kind != 'key')
            throw new Error('invalid previous key block');
        var signed = BlockSet.SignBlock(micro_block, pre_key_block.meta.validatorPub, private_key, public_key);
        return signed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var sign_block = function (block, pub_keys, private_key, public_key) {
    try {
        if (!isBlock(block))
            throw new Error('invalid block');
        else if (typeof private_key != 'string')
            throw new Error('invalid private key');
        else if (typeof public_key != 'string')
            throw new Error('invalid public key');
        var signed = BlockSet.SignBlock(block, pub_keys, private_key, public_key);
        if (!isBlock(signed))
            throw new Error('invalid signed block');
        return signed;
    }
    catch (e) {
        throw new Error(e);
    }
};
var accept_key_block = function (key_block, chain, StateData, LockData) {
    try {
        if (!isBlock(key_block) || key_block.meta.kind != 'key')
            throw new Error('invalid block');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        var accepted = BlockSet.AcceptKeyBlock(key_block, chain, StateData, LockData);
        if (accepted[0].some(function (s) { return !isState(s); }))
            throw new Error('invalid accepted state data');
        else if (accepted[1].some(function (l) { return !isLock(l); }))
            throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch (e) {
        throw new Error(e);
    }
};
var accept_micro_block = function (micro_block, chain, StateData, LockData) {
    try {
        if (!isBlock(micro_block) || micro_block.meta.kind != 'micro')
            throw new Error('invalid block');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        var accepted = BlockSet.AcceptMicroBlock(micro_block, chain, StateData, LockData);
        if (accepted[0].some(function (s) { return !isState(s); }))
            throw new Error('invalid accepted state data');
        else if (accepted[1].some(function (l) { return !isLock(l); }))
            throw new Error('invalid accepted lock data');
        return accepted;
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.block = {
    isBlock: isBlock,
    isBlockMeta: isBlockMeta,
    empty_block: BlockSet.empty_block(),
    search_key_block: search_key_block,
    search_micro_block: search_micro_block,
    get_tree_root: get_tree_root,
    pos_staking: pos_staking,
    verify_key_block: verify_key_block,
    verify_micro_block: verify_micro_block,
    create_key_block: create_key_block,
    create_micro_block: create_micro_block,
    sign_block: sign_block,
    accept_key_block: accept_key_block,
    accept_micro_block: accept_micro_block
};
var isPool = function (pool) {
    return !Object.values(pool).some(function (tx) { return !isTx(tx); });
};
var tx2pool = function (pool, tx, chain, StateData, LockData) {
    try {
        if (!isPool(pool))
            throw new Error('invalid pool');
        else if (!isTx(tx))
            throw new Error('invalid tx');
        else if (chain.some(function (b) { return !isBlock(b); }))
            throw new Error('invalid chain');
        else if (StateData.some(function (s) { return !isState(s); }))
            throw new Error('invalid state data');
        else if (LockData.some(function (l) { return !isLock(l); }))
            throw new Error('invalid lock data');
        var new_pool = PoolSet.Tx_to_Pool(pool, tx, chain, StateData, LockData);
        if (!isPool(new_pool))
            throw new Error('invalid new pool');
        return new_pool;
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.pool = {
    isPool: isPool,
    tx2pool: tx2pool
};
