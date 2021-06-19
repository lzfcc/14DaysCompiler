export interface Environment {
    put(name: string, value: object)
    get(name: string)
}

export class BasicEnv implements Environment {
    protected values: { [key: string]: object } = {}
    constructor() {}
    put(name: string, value: object) {
        this.values[name] = value
    }
    get(name: string) {
        return this.values[name]
    }
}

export class NestedEnv implements Environment {
    protected outer = null
    protected values = {}
    constructor(e?: Environment) {
        this.outer = e
    }
    get(name: string) {
        const v = this.values[name]
        if (v === undefined && this.outer) {
            return this.outer.get(name)
        }
        return v
    }
    put(name: string, value: object, intoThis = false) {
        if (intoThis) {
            this.values[name] = value
            return
        }
        const env = this.where(name) as NestedEnv
        if (!env) {
            this.values[name] = value
        } else {
            env.put(name, value, true)
        }
    }
    where(name: string): Environment {
        if (this.values[name] !== undefined) {
            return this
        }
        if (this.outer) {
            return this.outer.where(name)
        }
        return null
    }
}
