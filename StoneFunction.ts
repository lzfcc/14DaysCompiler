import { BlockStmnt, ParameterList } from './ASTree'
import { Environment, NestedEnv } from './Environment'

export class StoneFunction {
    readonly parameters: ParameterList
    readonly body: BlockStmnt
    protected readonly env: Environment
    constructor(parameters: ParameterList, body: BlockStmnt, env: Environment) {
        this.parameters = parameters
        this.body = body
        this.env = env
    }
    makeEnv() {
        return new NestedEnv(this.env)
    }
    // toString(){
    //     return `<function>`
    // }
}
