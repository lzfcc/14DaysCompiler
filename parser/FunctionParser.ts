import BasicParser from './BasicParser'
import { Parser } from './Parser'
import { ParameterList, DefStmnt, Arguments, Closure, NullStmnt } from '../ast/ASTree'
import Lexer from '../ast/Lexer'
import { NestedEnv } from '../eval/Environment'
import { Token } from '../ast/Token'

export class FunctionParser extends BasicParser {
    param = Parser.rule('param').identifier(this.reserved)
    params = Parser.rule(ParameterList)
        .ast(this.param)
        .repeat(Parser.rule().sep(',').ast(this.param))
    paramList = Parser.rule().sep('(').maybe(this.params).sep(')')
    def = Parser.rule(DefStmnt)
        .sep('def')
        .identifier(this.reserved)
        .ast(this.paramList)
        .ast(this.block)
    args = Parser.rule(Arguments)
        .ast(this.expr)
        .repeat(Parser.rule().sep(',').ast(this.expr))
    postfix = Parser.rule('postfix').sep('(').maybe(this.args).sep(')')

    constructor() {
        super()
        this.reserved.push(')')
        this.primary.repeat(this.postfix)
        this.simple.option(this.args)
        this.program.insertChoice(this.def) // <=> program = rule().or(def, statement, rule(NullStmt)).sep(',', EOL)
    }
}

export class ClosureParser extends FunctionParser {
    constructor() {
        super()
        this.program.insertChoice(Parser.rule(Closure).sep('fun').ast(this.paramList).ast(this.block))
    }
}

const lexer = new Lexer('./test-function.stone')
lexer.process().then(() => {
    const env = new NestedEnv()
    const funcParser = new FunctionParser()
    while (lexer.peek(0) != Token.EOF) {
        const ast = funcParser.parse(lexer)
        console.log('=> ', ast.toString())
        if (!(ast instanceof NullStmnt)) {
            console.log('eval =>', ast.eval(env))
        }
    }
})
