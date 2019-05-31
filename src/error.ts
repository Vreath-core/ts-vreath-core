abstract class OriginalErr extends Error {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class HexError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class UintError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class SignError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class AddressError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class HashError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class TimestampError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class DBError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class TrieError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class StateError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class TxError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class BlockError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class ContractError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class PoolError extends OriginalErr {
    constructor(msg:string){super(msg)}
}

export class UnitError extends OriginalErr {
    constructor(msg:string){super(msg)}
}
