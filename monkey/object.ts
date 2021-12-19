export abstract class MObject {
    abstract primitive: any
    abstract inspect(): string
    type() {
        return this.constructor.name
    }
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
}

export class Null extends MObject {
    primitive = null
    inspect(): string {
        return 'null'
    }
}

export class MError extends MObject {
    primitive: string
    constructor(msg: string) {
        super()
        this.primitive = msg
    }
    inspect(): string {
        return this.primitive
    }
}

export class ReturnValue extends MObject {
    primitive: MObject
    constructor(val: MObject) {
        super()
        this.primitive = val
    }
    inspect(): string {
        return this.primitive.inspect()
    }
}

export class Environment {
    store: { [key: string]: MObject } = {}
    get(name: string) {
        return this.store[name]
    }
    set(name: string, val: MObject) {
        this.store[name] = val
    }
}
