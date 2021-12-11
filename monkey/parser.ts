import * as token from './token'
import * as lexer from './lexer'
import * as ast from './ast'
import Lexer from '../ast/Lexer'

class Parser {
    l: lexer.Lexer
    curToken: token.Token
    peekToken: token.Token

    constructor(l: lexer.Lexer) {
        this.l = l

        // Read two tokens, so curToken and peekToken are both set
        this.nextToken()
        this.nextToken()
    }

    nextToken() {
        this.curToken = this.peekToken
        this.peekToken = this.l.nextToken()
    }

    ParseProgram(): ast.Program {
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

    parseStatement(): ast.Statement {
        switch (this.curToken.type) {
            case token.LET:
                return this.parseLetStatement()
            case token.RETURN:
                return this.parseReturnStatement()
            default:
                return null
        }
    }

    parseLetStatement(): ast.LetStatement {
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

    parseReturnStatement(): ast.Statement {
        const stmt = new ast.ReturnStatement(this.curToken)

        this.nextToken()

        // TODO: We're skipping the expressions until we
        // encounter a semicolon
        while (!this.curTokenIs(token.SEMICOLON)) {
            this.nextToken()
        }

        return stmt
    }

    curTokenIs(t: token.TokenType): boolean {
        return this.curToken.type == t
    }

    peekTokenIs(t: token.TokenType): boolean {
        return this.peekToken.type == t
    }

    expectPeek(t: token.TokenType): boolean {
        if (this.peekTokenIs(t)) {
            this.nextToken()
            return true
        } else {
            return false
        }
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
    const program = p.ParseProgram()

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

    const program = p.ParseProgram()

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

TestReturnStatement()
