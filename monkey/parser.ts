import * as token from './token'
import * as lexer from './lexer'
import * as ast from './ast'

type PrefixParseFn = () => ast.Expression
// expr: left expression
type InfixParseFn = (expr: ast.Expression) => ast.Expression

enum OP_ORDER {
    LOWEST = 0,
    ASSIGN,
    EQUALS,
    LESSGREATER,
    SUM,
    PRODUCT,
    PREFIX, // !x or -x
    CALL // myfunction(x)
}

const precedences = {
    [token.ASSIGN]: OP_ORDER.ASSIGN,
    [token.EQ]: OP_ORDER.EQUALS,
    [token.NOT_EQ]: OP_ORDER.EQUALS,
    [token.LT]: OP_ORDER.LESSGREATER,
    [token.GT]: OP_ORDER.LESSGREATER,
    [token.PLUS]: OP_ORDER.SUM,
    [token.MINUS]: OP_ORDER.SUM,
    [token.SLASH]: OP_ORDER.PRODUCT,
    [token.ASTERISK]: OP_ORDER.PRODUCT,
    [token.MODULO]: OP_ORDER.PRODUCT,
    // add this for function call, a little hard to think
    [token.LPAREN]: OP_ORDER.CALL
}

export default class Parser {
    l: lexer.Lexer
    curToken: token.Token
    peekToken: token.Token
    errors: string[] = []

    prefixParseFns: { [token: token.TokenType]: PrefixParseFn } = {}
    infixParseFns: { [token: token.TokenType]: InfixParseFn } = {}

    constructor(l: lexer.Lexer) {
        this.l = l
        this.nextToken()
        this.nextToken()
        this.registerParseFns()
    }

    private registerParseFns() {
        // prefix
        this.registerPrefix(token.IDENT, this.parseIdentifier.bind(this))
        this.registerPrefix(token.INT, this.parseIntegerLiteral.bind(this))
        this.registerPrefix(token.BANG, this.parsePrefixExpression.bind(this))
        this.registerPrefix(token.MINUS, this.parsePrefixExpression.bind(this))
        this.registerPrefix(token.TRUE, this.parseBool.bind(this))
        this.registerPrefix(token.FALSE, this.parseBool.bind(this))
        this.registerPrefix(
            token.LPAREN,
            this.parseGroupedExpression.bind(this)
        )
        this.registerPrefix(token.IF, this.parseIfExpression.bind(this))
        this.registerPrefix(token.WHILE, this.parseWhileExpression.bind(this))
        this.registerPrefix(
            token.FUNCTION,
            this.parseFunctionLiteral.bind(this)
        )

        // infix
        this.registerInfix(token.PLUS, this.parseInfixExpression.bind(this))
        this.registerInfix(token.MINUS, this.parseInfixExpression.bind(this))
        this.registerInfix(token.SLASH, this.parseInfixExpression.bind(this))
        this.registerInfix(token.ASTERISK, this.parseInfixExpression.bind(this))
        this.registerInfix(token.MODULO, this.parseInfixExpression.bind(this))
        this.registerInfix(token.EQ, this.parseInfixExpression.bind(this))
        this.registerInfix(token.NOT_EQ, this.parseInfixExpression.bind(this))
        this.registerInfix(token.LT, this.parseInfixExpression.bind(this))
        this.registerInfix(token.GT, this.parseInfixExpression.bind(this))
        this.registerInfix(token.ASSIGN, this.parseInfixExpression.bind(this))
        this.registerInfix(token.LPAREN, this.parseCallExpression.bind(this))

        // No suffix parse fn for now
    }

    private parseIdentifier() {
        return new ast.Identifier(this.curToken, this.curToken.literal)
    }

    private parseIntegerLiteral() {
        const val = Number(this.curToken.literal)
        if (Number.isNaN(val)) {
            this.errors.push(
                `could not parse ${this.curToken.literal} as integer`
            )
            return null
        }
        return new ast.IntegerLiteral(this.curToken, val)
    }

    private parsePrefixExpression() {
        const expr = new ast.PrefixExpression(
            this.curToken,
            this.curToken.literal
        )
        this.nextToken()
        expr.right = this.parseExpression(OP_ORDER.PREFIX)
        return expr
    }

    private parseInfixExpression(left: ast.Expression) {
        const expr = new ast.InfixExpression(
            this.curToken,
            this.curToken.literal,
            left
        )
        const prec = this.curPrecedence()
        this.nextToken()
        expr.right = this.parseExpression(prec)
        return expr
    }

    private parseBool() {
        return new ast.Bool(this.curToken, this.curTokenIs(token.TRUE))
    }

    private parseGroupedExpression() {
        this.nextToken()
        const expr = this.parseExpression(OP_ORDER.LOWEST)
        if (!this.expectPeek(token.RPAREN)) {
            return null
        }
        return expr
    }

    private parseIfExpression() {
        const expr = new ast.IfExpression(this.curToken)
        if (!this.expectPeek(token.LPAREN)) {
            return null
        }
        this.nextToken()
        expr.condition = this.parseExpression(OP_ORDER.LOWEST)
        if (!this.expectPeek(token.RPAREN)) {
            return null
        }
        if (!this.expectPeek(token.LBRACE)) {
            return null
        }
        expr.consequence = this.parseBlockStatement()

        if (this.peekTokenIs(token.ELSE)) {
            this.nextToken()
            if (!this.expectPeek(token.LBRACE)) {
                return null
            }
            expr.alternative = this.parseBlockStatement()
        }
        return expr
    }

    private parseWhileExpression() {
        const expr = new ast.WhileExpression(this.curToken)
        if (!this.expectPeek(token.LPAREN)) {
            return null
        }
        this.nextToken()
        expr.condition = this.parseExpression(OP_ORDER.LOWEST)
        if (!this.expectPeek(token.RPAREN)) {
            return null
        }
        if (!this.expectPeek(token.LBRACE)) {
            return null
        }
        expr.body = this.parseBlockStatement()
        return expr
    }

    private parseFunctionLiteral() {
        const lit = new ast.FunctionLiteral(this.curToken)
        if (!this.expectPeek(token.LPAREN)) {
            return null
        }
        lit.parameters = this.parseFunctionParameters()
        if (!this.expectPeek(token.LBRACE)) {
            return null
        }
        lit.body = this.parseBlockStatement()
        return lit
    }

    private parseCallExpression(func: ast.Expression) {
        const expr = new ast.CallExpression(this.curToken, func)
        expr.args = this.parseCallArguments()
        return expr
    }

    private parseCallArguments() {
        const args: ast.Expression[] = []
        if (this.peekTokenIs(token.RPAREN)) {
            this.nextToken()
            return args
        }
        this.nextToken()
        args.push(this.parseExpression(OP_ORDER.LOWEST))
        while (this.peekTokenIs(token.COMMA)) {
            this.nextToken()
            this.nextToken()
            args.push(this.parseExpression(OP_ORDER.LOWEST))
        }
        if (!this.expectPeek(token.RPAREN)) {
            return null
        }
        return args
    }

    private nextToken() {
        this.curToken = this.peekToken
        this.peekToken = this.l.nextToken()
    }

    parseProgram(): ast.Program {
        const program = new ast.Program()

        while (this.curToken.type !== token.EOF) {
            const stmt = this.parseStatement()
            if (stmt) {
                program.statements.push(stmt)
            }
            this.nextToken()
        }

        return program
    }

    private parseStatement(): ast.Statement {
        switch (this.curToken.type) {
            case token.LET:
                return this.parseLetStatement()
            case token.RETURN:
                return this.parseReturnStatement()
            default:
                return this.parseExpressionStatement()
        }
    }

    private parseLetStatement(): ast.LetStatement {
        const stmt = new ast.LetStatement(this.curToken)
        if (!this.expectPeek(token.IDENT)) {
            return null
        }
        stmt.name = new ast.Identifier(this.curToken, this.curToken.literal)
        if (!this.expectPeek(token.ASSIGN)) {
            return null
        }
        this.nextToken()
        stmt.value = this.parseExpression(OP_ORDER.LOWEST)
        if (this.peekTokenIs(token.SEMICOLON)) {
            this.nextToken()
        }
        return stmt
    }

    private parseReturnStatement(): ast.Statement {
        const stmt = new ast.ReturnStatement(this.curToken)
        this.nextToken()
        stmt.returnValue = this.parseExpression(OP_ORDER.LOWEST)
        if (this.peekTokenIs(token.SEMICOLON)) {
            this.nextToken()
        }
        return stmt
    }

    private parseExpressionStatement(): ast.Statement {
        const stmt = new ast.ExpressionStatement(
            this.curToken,
            this.parseExpression(OP_ORDER.LOWEST)
        )
        if (this.peekTokenIs(token.SEMICOLON)) {
            this.nextToken()
        }
        return stmt
    }

    private noPrefixParseFnError(t: token.TokenType) {
        this.errors.push(`no prefix parse function for ${t} found`)
    }

    /**
     * This is the core of Parser
     * @param precedence: OP_ORDER
     * @returns ast.Expression
     */
    private parseExpression(precedence: OP_ORDER): ast.Expression {
        const prefix = this.prefixParseFns[this.curToken.type]
        if (!prefix) {
            this.noPrefixParseFnError(this.curToken.type)
            return null
        }

        let leftExpr = prefix()

        while (
            !this.peekTokenIs(token.SEMICOLON) &&
            precedence < this.peekPrecedence()
        ) {
            const infix = this.infixParseFns[this.peekToken.type]
            if (!infix) {
                return leftExpr
            }
            this.nextToken()
            leftExpr = infix(leftExpr)
        }
        return leftExpr
    }

    private parseBlockStatement(): ast.BlockStatement {
        const block = new ast.BlockStatement(this.curToken)
        this.nextToken()
        while (!this.curTokenIs(token.RBRACE) && !this.curTokenIs(token.EOF)) {
            const stmt = this.parseStatement()
            if (stmt) {
                block.statements.push(stmt)
            }
            this.nextToken()
        }
        return block
    }

    parseFunctionParameters(): ast.Identifier[] {
        const identifiers: ast.Identifier[] = []
        if (this.peekTokenIs(token.RPAREN)) {
            this.nextToken()
            return identifiers
        }
        this.nextToken() // skip '('
        let id = new ast.Identifier(this.curToken, this.curToken.literal)
        identifiers.push(id)
        while (this.peekTokenIs(token.COMMA)) {
            this.nextToken() // skip current id token
            this.nextToken() // skip ','
            id = new ast.Identifier(this.curToken, this.curToken.literal)
            identifiers.push(id)
        }
        if (!this.expectPeek(token.RPAREN)) {
            return null
        }
        return identifiers
    }

    private curTokenIs(t: token.TokenType): boolean {
        return this.curToken.type == t
    }

    private peekTokenIs(t: token.TokenType): boolean {
        return this.peekToken.type == t
    }

    private peekError(t: token.TokenType) {
        const msg = `expected next token to be ${t}, got ${this.peekToken.type} instead`
        this.errors.push(msg)
    }

    private expectPeek(t: token.TokenType): boolean {
        if (this.peekTokenIs(t)) {
            this.nextToken()
            return true
        } else {
            this.peekError(t)
            return false
        }
    }

    private registerPrefix(tokenType: token.TokenType, fn: PrefixParseFn) {
        this.prefixParseFns[tokenType] = fn
    }

    private registerInfix(tokenType: token.TokenType, fn: InfixParseFn) {
        this.infixParseFns[tokenType] = fn
    }

    peekPrecedence(): OP_ORDER {
        return precedences[this.peekToken.type] || OP_ORDER.LOWEST
    }

    curPrecedence(): OP_ORDER {
        return precedences[this.curToken.type] || OP_ORDER.LOWEST
    }
}
