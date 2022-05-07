import * as ast from './ast'

export abstract class MObject {
    primitive: any
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

export class MFunction extends MObject {
    inspect(): string {
        const params = []
        for (const p of this.parameters) {
            params.push(p.string())
        }
        return `fn("${params.join(', ')}
            ${this.body.string()}
        }`
    }
    primitive = null
    parameters: ast.Identifier[]
    body: ast.BlockStatement
    env: Environment
    constructor(params: ast.Identifier[], body: ast.BlockStatement, env: Environment) {
        super()
        this.parameters = params
        this.body = body
        this.env = env
    }
}

export class Environment {
    store: { [key: string]: MObject } = {}
    outer: Environment = null
    get(name: string): MObject {
        // return this.store[name]
        let obj = this.store[name]
        if (obj === undefined && this.outer) {
            obj = this.outer.get(name)
        }
        return obj
    }
    set(name: string, val: MObject) {
        this.store[name] = val
    }

    static EnclosedEnvironment(outer: Environment): Environment {
        const env = new Environment()
        env.outer = outer
        return env
    }
}
