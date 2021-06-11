export interface Environment {
    put(name: string, value: object)
    get(name: string)
}

export class BasicEnv implements Environment {
    protected values: { [key: string]: object }
    constructor() {
        this.values = {}
    }
    put(name: string, value: object) {
        this.values[name] = value
    }
    get(name: string) {
        return this.values[name]
    }
}