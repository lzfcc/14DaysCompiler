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
import { BasicEnv } from "./Environment"


/*
Java implementation:
protected static abstract class Factory {
        protected abstract ASTree make0(Object arg) throws Exception;
        protected ASTree make(Object arg) {
            try {
                return make0(arg);
            } catch (IllegalArgumentException e1) {
                throw e1;
            } catch (Exception e2) {
                throw new RuntimeException(e2); // this compiler is broken.
            }
        }
        protected static Factory getForASTList(Class<? extends ASTree> clazz) {
            Factory f = get(clazz, List.class);
            if (f == null)
                f = new Factory() {
                    protected ASTree make0(Object arg) throws Exception {
                        List<ASTree> results = (List<ASTree>)arg;
                        if (results.size() == 1)
                            return results.get(0);
                        else
                            return new ASTList(results);
                    }
                };
            return f;
        }
        protected static Factory get(Class<? extends ASTree> clazz,
                                     Class<?> argType)
        {
            if (clazz == null)
                return null;
            try {
                final Method m = clazz.getMethod("create",
                                                 new Class<?>[] { argType });
                return new Factory() {
                    protected ASTree make0(Object arg) throws Exception {
                        return (ASTree)m.invoke(null, arg);
                    }
                };
            } catch (NoSuchMethodException e) {}
            try {
                // Find the constructor of class `clazz`, the classes of the parameters should be specified in `argType`
                final Constructor<? extends ASTree> c
                    = clazz.getConstructor(argType);
                return new Factory() {
                    protected ASTree make0(Object arg) throws Exception {
                        return c.newInstance(arg);
                    }
                };
            } catch (NoSuchMethodException e) {
                throw new RuntimeException(e);
            }
        }
    }
*/

export const makeFactory = (cls: { new(...arg: any): any }) => {
    return (arg: any) => {
        if (typeof cls === 'function') { // a class
            if (typeof cls['create'] === 'function') {
                return cls['create'](arg)
            } else {
                return new cls(arg)
            }
        }
        if (Array.isArray(arg)) {
            return arg.length == 1 ? arg[0] : new ASTList(arg)
        }
        throw Error('factory error')
    }
}

export abstract class Element {
    public abstract parse(lexer: Lexer, list: Array<ASTree>)
    public abstract match(lexer: Lexer): boolean
}

export class Tree extends Element {
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

export class OrTree extends Element {
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

export class Repeat extends Element {
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

export abstract class ATokenElem extends Element {
    protected make
    constructor(type: any) {
        super()
        if (!type) {
            type = ASTLeaf
        }
        this.make = makeFactory(type) // this.factory = Factory.get(type, Token), in JavaScript no need to specify the type of constructor parameter class(Token)
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

export class IdTokenElem extends ATokenElem {
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

export class NumTokenElem extends ATokenElem {
    protected test(t: Token): boolean {
        return t.getType() == Type.number
    }
}

export class StrTokenElem extends ATokenElem {
    protected test(t: Token): boolean {
        return t.getType() == Type.string
    }
}

export class Leaf extends Element {
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

export class Skip extends Leaf {
    protected find(list: Array<ASTree>, t: Token) {}
}

export class Precedence {
    leftAssociative: boolean
    value: number
    constructor(value = 0, leftAssociative = true) {
        this.value = value
        this.leftAssociative = leftAssociative
    }
}

export class Expr extends Element {
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

export class Parser {
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

    public reset(cls?): Parser {
        this.elements = []
        this.make = makeFactory(cls)
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
