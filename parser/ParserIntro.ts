import { ASTLeaf, ASTree, BinaryExpr, NumberLiteral } from '../ast/ASTree'
import Lexer from '../ast/Lexer'
import { ParseError } from '../Error'
import { Token, Type } from '../ast/Token'

// chapter 16
export class ExprParser {
    private lexer: Lexer

    constructor(lexer: Lexer) {
        this.lexer = lexer
    }

    public expression() {
        let left = this.term()
        while (this.isToken('+') || this.isToken('-')) {
            const op = new ASTLeaf(this.lexer.read())
            const right = this.term()
            left = new BinaryExpr([left, op, right])
        }
        return left
    }

    public term() {
        let left = this.factor()
        while (this.isToken('*') || this.isToken('/')) {
            const op = new ASTLeaf(this.lexer.read())
            const right = this.factor()
            left = new BinaryExpr([left, op, right])
        }
        return left
    }

    public factor() {
        if (this.isToken('(')) {
            this.token('(')
            const e = this.expression()
            this.token(')')
            return e
        } else {
            const t = this.lexer.read()
            if (t.getType() == Type.number) {
                const n = new NumberLiteral(t)
                return n
            } else {
                throw new ParseError(t)
            }
        }
    }

    private token(name: string) {
        const t = this.lexer.read()
        if (name && !(t.getType() == Type.identifier && name === t.getText())) {
            throw new ParseError(t)
        }
    }

    private isToken(name: string) {
        const t = this.lexer.peek(0)
        return t.getType() == Type.identifier && name === t.getText()
    }
}

interface Precedence {
    value: number
    leftAssociative: boolean
}

export class OpPrecedenceParser {
    private lexer: Lexer
    protected operators: { [key: string]: Precedence}

    constructor(lexer: Lexer) {
        this.lexer = lexer
        this.operators = {
            '<': { value: 1, leftAssociative: true },
            '>': { value: 1, leftAssociative: true },
            '+': { value: 2, leftAssociative: true },
            '-': { value: 2, leftAssociative: true },
            '*': { value: 3, leftAssociative: true },
            '/': { value: 3, leftAssociative: true },
            '^': { value: 4, leftAssociative: false }
        }
    }

    public expression(): ASTree {
        let right = this.factor()
        let next
        while (next = this.nextOperator()) {
            right = this.doShift(right, next)
        }
        return right
    }

    private doShift(left: ASTree, prec: Precedence): ASTree {
        const op = new ASTLeaf(this.lexer.read())
        let right = this.factor()
        let next
        while ((next = this.nextOperator()) && this.rightIsExpr(prec, next)) {
            right = this.doShift(right, next.value)
        }
        return new BinaryExpr([left, op, right])
    }

    private nextOperator(): Precedence {
        const t = this.lexer.peek(0)
        if (t.getType() === Type.identifier) {
            return this.operators[t.getText()]
        } else {
            return null
        }
    }

    private rightIsExpr(prec: Precedence, nextPrec: Precedence) {
        if (nextPrec.leftAssociative) {
            return prec.value < nextPrec.value
        } else {
            return prec.value <= nextPrec.value
        }
    }

    public factor() {
        if (this.isToken('(')) {
            this.token('(')
            const e = this.expression()
            this.token(')')
            return e
        } else {
            const t = this.lexer.read()
            if (t.getType() == Type.number) {
                const n = new NumberLiteral(t)
                return n
            } else {
                throw new ParseError(t)
            }
        }
    }

    private token(name: string) {
        const t = this.lexer.read()
        if (name && !(t.getType() == Type.identifier && name === t.getText())) {
            throw new ParseError(t)
        }
    }

    private isToken(name: string) {
        const t = this.lexer.peek(0)
        return t.getType() == Type.identifier && name === t.getText()
    }
}
