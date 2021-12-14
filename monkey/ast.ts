import * as token from './token'

export interface Node {
    // only for debugging
    tokenLiteral(): string
    string(): string
}

// a statment doesn't generate a value
export interface Statement extends Node {
    statementNode()
}

// an express generates a value
export interface Expression extends Node {
    expressionNode()
}

export class Program implements Statement {
    statementNode() {}
    string(): string {
        return this.statements.map((stmt) => stmt.string()).join()
    }
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
    constructor(token: token.Token) {
        this.token = token
    }
    statementNode() {}
    tokenLiteral() {
        return this.token.literal // token.LET
    }
    string(): string {
        return `${this.tokenLiteral()} ${this.name.string()} = ${this.value.string()};`
    }
}

export class Identifier implements Expression {
    token: token.Token
    value: string
    constructor(token: token.Token, value: string) {
        this.token = token
        this.value = value
    }
    expressionNode() {}
    tokenLiteral() {
        return this.token.literal // token.IDENT
    }
    string(): string {
        return this.tokenLiteral()
    }
}

export class ReturnStatement implements Statement {
    token: token.Token
    returnValue: Expression
    constructor(token: token.Token) {
        this.token = token
    }
    statementNode() {}
    tokenLiteral(): string {
        return this.token.literal // token.RETURN
    }
    string(): string {
        return `${this.tokenLiteral()} ${this.returnValue.string()};`
    }
}

export class ExpressionStatement implements Statement {
    token: token.Token // the first token of the expression
    expression: Expression
    constructor(token: token.Token, expr: Expression) {
        this.token = token
        this.expression = expr
    }
    statementNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return `${this.expression.string()}`
    }
}

export class IntegerLiteral implements Expression {
    token: token.Token
    value: number
    constructor(token: token.Token, val: number) {
        this.token = token
        this.value = val
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return this.token.literal
    }
}

export class PrefixExpression implements Expression {
    token: token.Token
    operator: string
    right: Expression
    constructor(token: token.Token, opr: string) {
        this.token = token
        this.operator = opr
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return `(${this.operator}${this.right.string()})`
    }
}

export class InfixExpression implements Expression {
    token: token.Token
    operator: string
    left: Expression
    right: Expression
    constructor(token: token.Token, opr: string, left: Expression) {
        this.token = token
        this.operator = opr
        this.left = left
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return `(${this.left.string()}${this.operator}${this.right.string()})`
    }
}

export class Bool implements Expression {
    token: token.Token
    value: boolean
    constructor(token: token.Token, value: boolean) {
        this.token = token
        this.value = value
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return this.token.literal
    }
}

export class IfExpression implements Expression {
    token: token.Token
    condition: Expression
    consequence: BlockStatement
    alternative: BlockStatement
    constructor(token: token.Token) {
        this.token = token
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        let str = `if (${this.condition.string()}) {${this.consequence.string()}}`
        if (this.alternative) {
            str += ` else {${this.alternative.string()}}`
        }
        return str
    }
}

export class BlockStatement implements Statement {
    token: token.Token
    statements: Statement[] = []
    constructor(token: token.Token) {
        this.token = token
    }
    statementNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return this.statements.map((s) => s.string()).join()
    }
}

// no, this will not work
export class WhileExpression implements Expression {
    token: token.Token
    condition: Expression
    body: BlockStatement
    constructor(token: token.Token) {
        this.token = token
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        return `while ${this.condition.string()} {${this.body.string()}}`
    }
}

export class FunctionLiteral implements Expression {
    token: token.Token
    parameters: Identifier[]
    body: BlockStatement
    constructor(token: token.Token) {
        this.token = token
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        const paramStr = this.parameters.map((v) => v.string()).join(',')
        return `${this.tokenLiteral()}(${paramStr}){${this.body.string()}}`
    }
}

export class CallExpression implements Expression {
    token: token.Token // '('
    func: Expression // Identifer or FunctionLiteral
    args: Expression[]
    constructor(token: token.Token, func: Expression) {
        this.token = token
        this.func = func
    }
    expressionNode() {}
    tokenLiteral(): string {
        return this.token.literal
    }
    string(): string {
        const paramStr = this.args.map((v) => v.string()).join(',')
        return `${this.func.string()}(${paramStr})`
    }
}
