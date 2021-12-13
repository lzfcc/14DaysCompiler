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
}

class Parser {
    l: lexer.Lexer
    curToken: token.Token
    peekToken: token.Token

    prefixParseFns: { [token: token.TokenType]: PrefixParseFn } = {}
    infixParseFns: { [token: token.TokenType]: InfixParseFn } = {}

    // use arrow function to avoid JS "this" problem!
    private parseIdentifier = () => {
        return new ast.Identifier(this.curToken, this.curToken.literal)
    }
    private parseIntegerLiteral = () => {
        const val = Number(this.curToken.literal)
        const lit = new ast.IntegerLiteral(this.curToken, val)
        // if (Number.isNaN(val)) {
        //     msg := fmt.Sprintf("could not parse %q as integer", p.curToken.Literal)
        //     p.errors = append(p.errors, msg)
        //     return nil
        // }
        return lit
    }
    private parsePrefixExpression = () => {
        const expr = new ast.PrefixExpression(
            this.curToken,
            this.curToken.literal
        )
        this.nextToken()
        expr.right = this.parseExpression(OP_ORDER.PREFIX)
        return expr
    }
    private parseInfixExpression = (left: ast.Expression) => {
        const expr = new ast.InfixExpression(this.curToken, this.curToken.literal, left)
        const prec = this.curPrecedence()
        this.nextToken()
        expr.right = this.parseExpression(prec)
        return expr
    }
    private parseBool = () => {
        return new ast.Bool(this.curToken, this.curTokenIs(token.TRUE))
    }
    private parseGroupedExpression = () => {
        this.nextToken()
        const expr = this.parseExpression(OP_ORDER.LOWEST) // !!: OP_ORDER.LOWEST, compared: parseInfixExpression 
        if (!this.expectPeek(token.RPAREN)) {
            return null
        }
        return expr
    }
    private parseIfExpression = () => {
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
    private parseWhileExpression = () => {
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

    constructor(l: lexer.Lexer) {
        this.l = l

        // Read two tokens, so curToken and peekToken are both set
        this.nextToken()
        this.nextToken()

        // prefix expressions
        this.registerPrefix(token.IDENT, this.parseIdentifier)
        this.registerPrefix(token.INT, this.parseIntegerLiteral)
        this.registerPrefix(token.BANG, this.parsePrefixExpression)
        this.registerPrefix(token.MINUS, this.parsePrefixExpression)

        // infix expressions
        this.registerInfix(token.PLUS, this.parseInfixExpression)
        this.registerInfix(token.MINUS, this.parseInfixExpression) // '-' can also be in an infix expression
        this.registerInfix(token.SLASH, this.parseInfixExpression)
        this.registerInfix(token.ASTERISK, this.parseInfixExpression)
        this.registerInfix(token.EQ, this.parseInfixExpression)
        this.registerInfix(token.NOT_EQ, this.parseInfixExpression)
        this.registerInfix(token.LT, this.parseInfixExpression)
        this.registerInfix(token.GT, this.parseInfixExpression)

        // maybe we need an assign statement?
        this.registerInfix(token.ASSIGN, this.parseInfixExpression)

        this.registerPrefix(token.TRUE, this.parseBool)
        this.registerPrefix(token.FALSE, this.parseBool)

        this.registerPrefix(token.LPAREN, this.parseGroupedExpression)
        this.registerPrefix(token.IF, this.parseIfExpression)
        this.registerPrefix(token.WHILE, this.parseWhileExpression)
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

        // TODO: We're skipping the expressions until we
        // encounter a semicolon
        while (!this.curTokenIs(token.SEMICOLON)) {
            this.nextToken()
        }

        return stmt
    }

    private parseReturnStatement(): ast.Statement {
        const stmt = new ast.ReturnStatement(this.curToken)

        this.nextToken()

        // TODO: We're skipping the expressions until we
        // encounter a semicolon
        while (!this.curTokenIs(token.SEMICOLON)) {
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

    // func (p *Parser) noPrefixParseFnError(t token.TokenType) {
    //     msg := fmt.Sprintf("no prefix parse function for %s found", t)
    //     p.errors = append(p.errors, msg)
    // }

    /**
     * This is the core of Parser
     * @param precedence: OP_ORDER
     * @returns ast.Expression
     */
    private parseExpression(precedence: OP_ORDER): ast.Expression {
        const prefix = this.prefixParseFns[this.curToken.type]
        if (!prefix) {
            // p.noPrefixParseFnError(p.curToken.Type)
            return null
        }

        let leftExpr = prefix()

        while (!this.peekTokenIs(token.SEMICOLON) && precedence < this.peekPrecedence()) {
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

    private curTokenIs(t: token.TokenType): boolean {
        return this.curToken.type == t
    }

    private peekTokenIs(t: token.TokenType): boolean {
        return this.peekToken.type == t
    }

    private expectPeek(t: token.TokenType): boolean {
        if (this.peekTokenIs(t)) {
            this.nextToken()
            return true
        } else {
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

function TestLetStatements() {
    const input = `
let x = 5;
let y = 10;
let foobar = 838383;
`
    const l = new lexer.Lexer(input)
    const p = new Parser(l)
    const program = p.parseProgram()

    if (!program) {
        console.error('ParseProgram() returned nil')
    }
    if (program.statements.length !== 3) {
        console.error(
            `program.Statements does not contain 3 statements. got=${program.statements.length}`
        )
    }

    const tests = ['x', 'y', 'foobar']

    tests.forEach((tt, i) => {
        const stmt = program.statements[i]
        if (testLetStatement(stmt, tt)) {
            console.error('Error')
        }
    })

    function testLetStatement(s: ast.Statement, name: string): boolean {
        if (s.tokenLiteral() !== 'let') {
            console.error(`s.TokenLiteral not 'let'. got=${s.tokenLiteral()}`)
            return false
        }

        if (s instanceof ast.LetStatement === false) {
            console.error(`s not *ast.LetStatement. got=${s}`)
            return false
        }

        let letStmt = s as ast.LetStatement
        if (letStmt.name.value != name) {
            console.error(
                `letStmt.Name.Value not '${name}'. got=${letStmt.name.value}`
            )
            return false
        }

        if (letStmt.name.tokenLiteral() != name) {
            console.error(`letStmt.Name not '${name}'. got=${letStmt.name}`)
            return false
        }

        return true
    }
}

// TestLetStatements()

function TestReturnStatement() {
    const input = `
    return 5;
    return 10;
    return 993322;
`
    const l = new lexer.Lexer(input)
    const p = new Parser(l)

    const program = p.parseProgram()

    if (program.statements.length !== 3) {
        console.error(
            `program.Statements does not contain 3 statements. got=${program.statements}`
        )
    }

    for (const stmt of program.statements) {
        if (stmt instanceof ast.ReturnStatement == false) {
            console.error(`stmt not *ast.returnStatement. got=${stmt}`)
            continue
        }
        if (stmt.tokenLiteral() != 'return') {
            console.error(
                `returnStmt.TokenLiteral not 'return', got ${stmt.tokenLiteral()}`
            )
        }
    }
}

// TestReturnStatement()

function ParserGeneralTest(scenario, input: string | string[]) {
    const tester = (input) => {
        const l = new lexer.Lexer(input)
        const p = new Parser(l)
        const program = p.parseProgram()

        console.log(`scenario: ${scenario}`)
        console.log(program)
        console.log(program.string())
    }

    if (Array.isArray(input)) {
        input.forEach((i) => tester(i))
    } else {
        tester(input)
    }
}

// ParserGeneralTest('IdentifierExpression', 'foobar;')

// ParserGeneralTest('IntegerLiteralExpression', '2021;')

// ParserGeneralTest('PrefixExpressions', [
//     '!foobar',
//     '-20',
//     '!true',
// ])

// ParserGeneralTest('InfixExpressions', [
//     '5 + 5;',
//     '5 - 5;',
//     '5 * 5;',
//     '5 / 5;',
//     '5 > 5;',
//     '5 < 5;',
//     '5 == 5;',
//     '5 != 5;'
// ])

// ParserGeneralTest('InfixExpressions', [
//     '-a + b;',
//     '!-a;',
//     'a + b - c;',
//     '4 * 5 / 2; 1 + 2',
//     '2 + 1 * 3 + 5',
//     '5 > 5 == 2 < 3;',
//     '5 < 5 != 4 > 2;',
//     '5 * 2 == 5 + 5',
//     '3 > 2 == 4 == 0', // ((3 > 2) == 4) == 0 => true
//     '0 * 1 == 1 > 1', // (0 * 1) == (1 > 1) => true

//     '!true',
//     'true == false',
//     '1 > 2 != true',

//     '(1 + 2) * 3',
//     '-(3 + 4)',
//     '!(true == false)'
// ])

// ParserGeneralTest('if-else expressions', [
//     'if (x < y) { x }',
//     'if (x < y) { x } else { y }'
// ])

// extended by me
ParserGeneralTest('if-else expressions with statement', [
    'if (x < y) { x }',
    'if (x < y) { x = y == x / 2; } else { x = x + y; y = !foo(x); }'
])
