export interface Result<T,E> {
    readonly ok:T,
    readonly err?:E
}

export class Result<T,E> implements Result<T,E> {
    constructor(readonly ok:T,readonly err?:E){}
}