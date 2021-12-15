export abstract class MObject {
    abstract primitive: any
    abstract inspect(): string
    // extended by me
    abstract valueOf(): number
}

export class Int extends MObject {
    primitive: number
    constructor(val: number) {
        super()
        this.primitive = val
    }
    inspect(): string {
        return String(this.primitive)
    }
    valueOf(): number {
        return this.primitive
    }
}

export class Bool extends MObject {
    primitive: boolean
    constructor(val: boolean) {
        super()
        this.primitive = val
    }
    inspect(): string {
        return String(this.primitive)
    }
    valueOf(): number {
        return Number(this.primitive)
    }
}

export class Null extends MObject {
    primitive = null
    inspect(): string {
        return 'null'
    }
    valueOf(): number {
        return 0
    }
}