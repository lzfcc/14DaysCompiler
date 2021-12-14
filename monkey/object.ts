export abstract class MObject {
    abstract value: any
    inspect(): string {
        throw Error('override by subclass')
    }
}

export class Int extends MObject {
    value: number
    constructor(val: number) {
        super()
        this.value = val
    }
    inspect(): string {
        return String(this.value)
    }
}

export class Bool extends MObject {
    value: boolean
    constructor(val: boolean) {
        super()
        this.value = val
    }
    inspect(): string {
        return String(this.value)
    }
}

export class Null extends MObject {
    value = null
    inspect(): string {
        return 'null'
    }
}