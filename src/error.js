"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OriginalErr extends Error {
    constructor(msg) {
        super(msg);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
class HexError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.HexError = HexError;
class UintError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.UintError = UintError;
class SignError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.SignError = SignError;
class AddressError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.AddressError = AddressError;
class HashError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.HashError = HashError;
class TimestampError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.TimestampError = TimestampError;
class DBError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.DBError = DBError;
class TrieError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.TrieError = TrieError;
class StateError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.StateError = StateError;
class TxError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.TxError = TxError;
class BlockError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.BlockError = BlockError;
class ContractError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.ContractError = ContractError;
class PoolError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.PoolError = PoolError;
class UnitError extends OriginalErr {
    constructor(msg) { super(msg); }
}
exports.UnitError = UnitError;
