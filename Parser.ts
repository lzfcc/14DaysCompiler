import { Token, Type } from './Token'
import {
    ASTLeaf,
    ASTList,
    ASTree,
    PrimaryExpr,
    BlockStmnt,
    IfStmnt,
    WhileStmnt,
    NullStmnt,
    NumberLiteral,
    StringLiteral,
    Name,
    NegativeExpr,
    BinaryExpr,
} from './ASTree'
import Lexer from './Lexer'
import { ParseError } from './Error'

const makeFactory = (Cls: { new(...arg: any): any }, Arg?) => {
    return (arg: any) => {
        if (typeof Cls === 'function') { // a class
            if (typeof Cls['create'] === 'function') {
                return Cls['create'](arg)
            } else {
                return new Cls(arg)
            }
        }
        if (Array.isArray(arg)) {
            return arg.length == 1 ? arg[0] : new ASTList(arg)
        }
        throw Error('factory error')
    }
}

abstract class Element {
    public abstract parse(lexer: Lexer, list: Array<ASTree>)
    public abstract match(lexer: Lexer): boolean
}

class Tree extends Element {
    public parser: Parser

    constructor(parser: Parser) {
        super()
        this.parser = parser
    }

    public parse(lexer: Lexer, list: Array<ASTree>) {
        list.push(this.parser.parse(lexer))
    }

    public match(lexer: Lexer): boolean {
        return this.parser.match(lexer)
    }
}

class OrTree extends Element {
    public parsers: Parser[]

    constructor(parsers: Parser[]) {
        super()
        this.parsers = parsers
    }

    public parse(lexer: Lexer, list: Array<ASTree>) {
        const p = this.choose(lexer)
        if (p) {
            list.push(p.parse(lexer))
        } else {
            throw new ParseError(lexer.peek(0))
        }
    }

    public match(lexer: Lexer): boolean {
        return this.choose(lexer) != null
    }

    protected choose(lexer: Lexer): Parser {
        for (const p of this.parsers) {
            if (p.match(lexer)) {
                return p
            }
        }
        return null
    }

    public insert(parser: Parser) {
        this.parsers.push(parser)
    }
}

class Repeat extends Element {
    public parser: Parser
    protected onlyOnce: boolean

    constructor(parser: Parser, once: boolean) {
        super()
        this.parser = parser
        this.onlyOnce = once
    }

    public parse(lexer: Lexer, list: Array<ASTree>) {
        while (this.parser.match(lexer)) {
            const t = this.parser.parse(lexer)
            if (!(t instanceof ASTList) || t.numChildren() > 0) {
                list.push(t)
            }
            if (this.onlyOnce) {
                break
            }
        }
    }

    public match(lexer: Lexer): boolean {
        return this.parser.match(lexer)
    }
}

abstract class ATokenElem extends Element {
    protected make
    constructor(type: any) {
        super()
        if (!type) {
            type = ASTLeaf
        }
        // this.factory = Factory.get(type, Token)
        this.make = makeFactory(type, Token)
    }

    public parse(lexer: Lexer, list: Array<ASTree>) {
        const t = lexer.read()
        if (this.test(t)) {
            const leaf = this.make(t)
            list.push(leaf)
        } else {
            throw new ParseError(t)
        }
    }

    public match(lexer: Lexer) {
        return this.test(lexer.peek(0))
    }

    protected abstract test(t: Token): boolean
}

class IdTokenElem extends ATokenElem {
    private reserved: string[]
    constructor(type, reserved = []) {
        super(type)
        this.reserved = reserved
    }
    protected test(t: Token): boolean {
        return (
            t.getType() == Type.identifier &&
            this.reserved.indexOf(t.getText()) < 0 // !this.reserved.includes(...)
        )
    }
}

class NumTokenElem extends ATokenElem {
    protected test(t: Token): boolean {
        return t.getType() == Type.number
    }
}

class StrTokenElem extends ATokenElem {
    protected test(t: Token): boolean {
        return t.getType() == Type.string
    }
}

class Leaf extends Element {
    protected tokens: string[]

    constructor(tokens: string[]) {
        super()
        this.tokens = tokens
    }

    public parse(lexer: Lexer, list: Array<ASTree>) {
        const t = lexer.read()
        if (t.getType() == Type.identifier) {
            for (const token of this.tokens) {
                if (t.getText() == token) {
                    this.find(list, t)
                    return
                }
            }
        }
        if (this.tokens.length) {
            throw new ParseError(t, this.tokens[0] + ' excepted.')
        } else {
            throw new ParseError(t)
        }
    }

    protected find(list: Array<ASTree>, t: Token) {
        list.push(new ASTLeaf(t))
    }

    public match(lexer: Lexer): boolean {
        const t = lexer.peek(0)
        if (t.getType() == Type.identifier) {
            for (const token of this.tokens) {
                if (t.getText() == token) {
                    return true
                }
            }
        }
        return false
    }
}

class Skip extends Leaf {
    protected find(list: Array<ASTree>, t: Token) {}
}

class Precedence {
    leftAssociative: boolean
    value: number
    constructor(value = 0, leftAssociative = true) {
        this.value = value
        this.leftAssociative = leftAssociative
    }
}

class Expr extends Element {
    protected make
    protected ops: { [operator: string]: Precedence }
    protected factor: Parser

    constructor(cls, exp, ops) {
        super()
        this.make = makeFactory(cls) // Factory.getForASTList(cls)
        this.ops = ops
        this.factor = exp
    }

    public parse(lexer: Lexer, list: Array<ASTree>) {
        let right = this.factor.parse(lexer)
        let prec = null
        while ((prec = this.nextOperator(lexer))) {
            right = this.doShift(lexer, right, prec)
        }
        list.push(right)
    }

    private doShift(lexer: Lexer, left: ASTree, prec: Precedence) {
        const list = []
        list.push(left)
        list.push(new ASTLeaf(lexer.read()))
        let right = this.factor.parse(lexer)
        let next = null
        while (
            (next = this.nextOperator(lexer)) &&
            this.rightIsExpr(prec, next)
        ) {
            right = this.doShift(lexer, right, next)
        }
        list.push(right)
        return this.make(list)
    }

    private nextOperator(lexer: Lexer): Precedence {
        const t = lexer.peek(0)
        if (t.getType() == Type.identifier) {
            return this.ops[t.getText()]
        } else {
            return null
        }
    }

    private rightIsExpr(prec: Precedence, next: Precedence) {
        if (next.leftAssociative) {
            return prec.value < next.value
        } else {
            return prec.value <= next.value
        }
    }

    public match(lexer: Lexer): boolean {
        return this.factor.match(lexer)
    }
}

class Parser {
    protected elements: Element[]
    protected make: Function

    constructor(arg = null) {
        if (arg instanceof Parser) {
            this.elements = arg.elements
            this.make = arg.make
        } else {
            this.reset(arg)
        }
    }

    public parse(lexer: Lexer): ASTree {
        const res = []
        for (const e of this.elements) {
            e.parse(lexer, res)
        }
        return this.make(res)
    }

    public match(lexer: Lexer) {
        if (this.elements.length) {
            return this.elements[0].match(lexer)
        } else {
            return true
        }
    }

    public static rule(cls = null): Parser {
        return new Parser(cls)
    }

    public reset(Cls?): Parser {
        this.elements = []
        this.make = makeFactory(Cls)
        return this
    }

    public number(cls = null): Parser {
        this.elements.push(new NumTokenElem(cls))
        return this
    }

    public identifier(cls = null, reserved = []): Parser {
        this.elements.push(new IdTokenElem(cls, reserved))
        return this
    }

    public string(cls = null): Parser {
        this.elements.push(new StrTokenElem(cls))
        return this
    }

    public token(...pat: string[]): Parser {
        this.elements.push(new Leaf(pat))
        return this
    }

    public sep(...pat: string[]): Parser {
        this.elements.push(new Skip(pat))
        return this
    }

    public ast(p: Parser): Parser {
        this.elements.push(new Tree(p))
        return this
    }

    public or(...p: Parser[]): Parser {
        this.elements.push(new OrTree(p))
        return this
    }

    public maybe(p: Parser): Parser {
        const p2 = new Parser(p)
        p2.reset()
        this.elements.push(new OrTree([p, p2]))
        return this
    }

    public option(p: Parser): Parser {
        this.elements.push(new Repeat(p, true))
        return this
    }

    public repeat(p: Parser): Parser {
        this.elements.push(new Repeat(p, false))
        return this
    }

    public expression(cls, sub: Parser, ops): Parser {
        this.elements.push(new Expr(cls, sub, ops))
        return this
    }

    public insertChoice(p: Parser): Parser {
        const e = this.elements[0]
        if (e instanceof OrTree) {
            ;(e as OrTree).insert(p)
        } else {
            const copy = new Parser(this)
            this.reset()
            this.or(p, copy)
        }
        return this
    }
}

const reserved = [';', '}', Token.EOL]
const operators = {
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
const expr0 = Parser.rule()
const primary = Parser.rule(PrimaryExpr).or(
    Parser.rule().sep('(').ast(expr0).sep(')'),
    Parser.rule().number(NumberLiteral),
    Parser.rule().identifier(Name, reserved),
    Parser.rule().string(StringLiteral)
)
const factor = Parser.rule().or(
    Parser.rule(NegativeExpr).sep('-').ast(primary),
    primary
)
const expr = expr0.expression(BinaryExpr, factor, operators)

const statement0 = Parser.rule()
const block = Parser.rule(BlockStmnt)
    .sep('{')
    .option(statement0)
    .repeat(Parser.rule().sep(';', Token.EOL).option(statement0))
    .sep('}')
const simple = Parser.rule(PrimaryExpr).ast(expr) // ???
const statement = statement0.or(
    Parser.rule(IfStmnt)
        .sep('if')
        .ast(expr)
        .ast(block)
        .option(Parser.rule().sep('else').ast(block)),
    Parser.rule(WhileStmnt).sep('while').ast(expr).ast(block),
    simple
)

const program = Parser.rule()
    .or(statement, Parser.rule(NullStmnt))
    .sep(';', Token.EOL)

const lexer = new Lexer('./test-lexer.txt')
lexer.process().then(() => {
    while (lexer.peek(0) != Token.EOF) {
        const ast = program.parse(lexer)
        console.log('=> ' + ast.toString())
    }
})
