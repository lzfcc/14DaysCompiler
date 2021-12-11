import { ASTLeaf } from '../ast/ASTree'
import * as token from './token'

interface Node {
    // only for debugging
    tokenLiteral(): string
}

// a statment doesn't generate a value
export interface Statement extends Node {
    statementNode()
}

// an express generates a value
export interface Expression extends Node {
    expressionNode()
}

export class Program {
    statements: Statement[] = []
    tokenLiteral() {
        if (this.statements.length > 0) {
            return this.statements[0].tokenLiteral()
        } else {
            return ''
        }
    }
}

/**
 * lex y = add(1, 2) * 5
 * @property name: Identifier {token: token.IDENT, value: 'y'}
 * @property value: Expression add(1, 2) * 5
 * @property token: token.LET
 */
export class LetStatement implements Statement {
    token: token.Token
    name: Identifier
    value: Expression
    constructor (token: token.Token) {
        this.token = token
    }
    statementNode() {}
    tokenLiteral() {
        return this.token.literal // token.LET
    }
}

export class Identifier implements Expression {
    token: token.Token
    value: string
    constructor (token: token.Token, value: string) {
        this.token = token
        this.value = value
    }
    expressionNode() {}
    tokenLiteral() {
        return this.token.literal // token.IDENT
    }
}

export class ReturnStatement implements Statement {
    statementNode() {}
    tokenLiteral(): string {
        return this.token.literal // token.RETURN
    }
    token: token.Token
    returnValue: Expression
    constructor (token: token.Token) {
        this.token = token
    }
}
