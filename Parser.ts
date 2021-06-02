import { Token, Type } from './Token'
import { ASTLeaf, ASTList, ASTree } from './ASTree'
import Lexer from './Lexer'
import { ParseError } from './Error'

abstract class Element {
    protected abstract parse(lexer: Lexer, list: Array<ASTree>)
    protected abstract match(lexer: Lexer): boolean
}

class Tree extends Element {
    protected parser: Parser

    constructor(parser: Parser) {
        super()
        this.parser = parser
    }

    protected parse(lexer: Lexer, list: Array<ASTree>) {
        list.push(this.parser.parse(lexer))
    }

    protected match(lexer: Lexer): boolean {
        return this.parser.match(lexer)
    }
}

class OrTree extends Element {
    protected parsers: Parser[]

    constructor(parsers: Parser[]) {
        super()
        this.parsers = parsers
    }

    protected parse(lexer: Lexer, list: Array<ASTree>) {
        const p = this.choose(lexer)
        if (p) {
            list.push(p.parse(lexer))
        } else {
            throw new ParseError(lexer.peek(0))
        }
    }

    protected match(lexer: Lexer): boolean {
        return this.choose(lexer)
    }

    protected choose(lexer: Lexer): Parser {
        for (const p of this.parsers) {
            if (p.match(lexer)) {
                return p
            }
        }
        return null
    }

    protected insert(parser: Parser) {
        this.parsers.push(parser)
    }
}

class Repeat extends Element {
    protected parser: Parser
    protected onlyOnce: boolean

    constructor(parser: Parser, once: boolean) {
        super()
        this.parser = parser
        this.onlyOnce = once
    }

    protected parse(lexer: Lexer, list: Array<ASTree>) {
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

    protected match(lexer: Lexer): boolean {
        return this.parser.match(lexer)
    }
}

abstract class ATokenElem extends Element {
    protected factory: Factory

    constructor(type) {
        super()
        if (!type) {
            type = ASTLeaf
        }
        this.factory = Factory.get(type, Token)
    }

    protected parse(lexer: Lexer, list: Array<ASTree>) {
        const t = lexer.read()
        if (this.test(t)) {
            const leaf = this.factory.make(t)
            list.push(leaf)
        } else {
            throw new ParseError(t)
        }
    }

    protected match(lexer: Lexer) {
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
            !this.reserved.includes(t.getText())
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

    protected parse(lexer: Lexer, list: Array<ASTree>) {
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

    protected match(lexer: Lexer): boolean {
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

interface Precedence {
    leftAssociative: boolean
    value: number
}

class Expr extends Element {
    protected factory: Factory
    protected ops: Object
    protected factor: Parser

    constructor(cls, exp, ops) {
        super()
        this.factory = Factory.getForASTList(cls)
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
        return this.factory.make(list)
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

    protected match(lexer: Lexer): boolean {
        return this.factor.match(lexer)
    }
}

class Parser {
    protected elements: Element[]

    constructor(arg = null) {
        if (arg instanceof Parser) {
            this.elements = arg.elements
        } else {
            this.reset(arg)
        }
    }

    public parse(lexer: Lexer): ASTree {
        const res = []
        for (const e of this.elements) {
            e.parse(lexer, res)
        }
        return res[0] // ???
    }

    protected match(lexer: Lexer) {
        if (this.elements.length) {
            return this.elements[0].match(lexer)
        } else {
            return true
        }
    }

    public rule(cls = null): Parser {
        return new Parser(cls)
    }

    public reset(cls = null): Parser {
        this.elements = []
        return this
    }

    public number(cls = null): Parser {
        this.elements.push(new NumTokenElem(cls))
        return this
    }

    public identifier(cls = null): Parser {
        this.elements.push(new IdTokenElem(cls))
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
        this.elements.push(new OrTree(p, p2))
        return this
    }

    public option(p: Parser): Parser {
        this.elements.push(new Repeat(p, true))
        return this
    }

    public expression(cls, sub: Parser, ops): Parser {
        this.elements.push(new Expr(cls, sub, ops))
        return this
    }

    public insertChoice(p: Parser): Parser {
        const e = this.elements[0]
        if (e instanceof OrTree) {
            (e as OrTree).insert(p)
        } else {
            this.reset()
            this.or(p, copy)
        }
        return this
    }
}
