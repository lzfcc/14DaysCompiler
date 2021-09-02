import { Precedence, Parser } from './Parser'
import {
    PrimaryExpr,
    NumberLiteral,
    Name,
    NegativeExpr,
    BinaryExpr,
    NullStmnt,
    StringLiteral,
    BlockStmnt,
    IfStmnt,
    WhileStmnt,
    ASTree,
} from '../ast/ASTree'
import { Token } from '../ast/Token'
import Lexer from '../ast/Lexer'
import { BasicEnv } from '../eval/Environment'

export default class BasicParser {
    reserved = [';', '}', Token.EOL]
    operators = {
        '=': new Precedence(1, false),
        '==': new Precedence(2),
        '!=': new Precedence(2),
        '<': new Precedence(2),
        '<=': new Precedence(2),
        '>': new Precedence(2),
        '>=': new Precedence(2),
        '+': new Precedence(3),
        '-': new Precedence(3),
        '*': new Precedence(4),
        '/': new Precedence(4),
        '%': new Precedence(4),
    }

    expr0 = Parser.rule()
    primary = Parser.rule(PrimaryExpr).or(
        Parser.rule().sep('(').ast(this.expr0).sep(')'),
        Parser.rule().number(NumberLiteral),
        Parser.rule().identifier(Name, this.reserved),
        Parser.rule().string(StringLiteral)
    )
    factor = Parser.rule('factor').or(
        Parser.rule(NegativeExpr).sep('-').ast(this.primary),
        this.primary
    )
    expr = this.expr0.expression(BinaryExpr, this.factor, this.operators)

    statement0 = Parser.rule()
    block = Parser.rule(BlockStmnt)
        .sep('{')
        .option(this.statement0)
        .repeat(Parser.rule().sep(';', Token.EOL).option(this.statement0))
        .sep('}')
    simple = Parser.rule(PrimaryExpr).ast(this.expr)
    statement = this.statement0.or(
        Parser.rule(IfStmnt)
            .sep('if')
            .ast(this.expr)
            .ast(this.block)
            .option(Parser.rule().sep('else').ast(this.block)),
        Parser.rule(WhileStmnt).sep('while').ast(this.expr).ast(this.block),
        this.simple
    )

    program = Parser.rule('program')
        .or(this.statement, Parser.rule(NullStmnt))
        .sep(';', Token.EOL)

    constructor() {}

    parse(lexer: Lexer): ASTree {
        return this.program.parse(lexer)
    }
}

// const lexer = new Lexer('./test-lexer.stone')
// lexer.process().then(() => {
//     const env = new BasicEnv()
//     const basicParser = new BasicParser()
//     while (lexer.peek(0) != Token.EOF) {
//         const ast = basicParser.parse(lexer)
//         console.log('=> ', ast.toString())
//         if (!(ast instanceof NullStmnt)) {
//             console.log('eval =>', ast.eval(env))
//         }
//     }
// })
