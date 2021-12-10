import * as token from './token'

const Keywords = {
    fn: token.FUNCTION,
    let: token.LET,
    true: token.TRUE,
    false: token.FALSE,
    if: token.IF,
    else: token.ELSE,
    return: token.RETURN
}

function Lexer(input) {
    // struct
    this.input = input
    this.position = 0 // current position in input (points to current char)
    this.readPosition = 0 // current reading position in input (after current char)
    this.ch = ''
}

Lexer.prototype.readChar = function () {
    if (this.readPosition >= this.input.length) {
        this.ch = '\0'
    } else {
        this.ch = this.input[this.readPosition]
    }
    this.position = this.readPosition
    this.readPosition += 1
}

Lexer.prototype.NextToken = function () {
    let tok = null

    this.skipWhitespace()
    switch (this.ch) {
        case '=':
            if (this.peekChar() === '=') {
                this.readChar()
                tok = newToken(token.EQ, '==')
            } else {
                tok = newToken(token.ASSIGN, this.ch)
            }
            break
        case ';':
            tok = newToken(token.SEMICOLON, this.ch)
            break
        case '(':
            tok = newToken(token.LPAREN, this.ch)
            break
        case ')':
            tok = newToken(token.RPAREN, this.ch)
            break
        case ',':
            tok = newToken(token.COMMA, this.ch)
            break
        case '+':
            tok = newToken(token.PLUS, this.ch)
            break
        case '{':
            tok = newToken(token.LBRACE, this.ch)
            break
        case '}':
            tok = newToken(token.RBRACE, this.ch)
            break
        case '\0':
            tok = newToken(token.EOF, this.ch)
            break
        case '+':
            tok = newToken(token.PLUS, this.ch)
            break
        case '-':
            tok = newToken(token.MINUS, this.ch)
            break
        case '!':
            if (this.peekChar() === '=') {
                this.readChar()
                tok = newToken(token.NOT_EQ, '!=')
            } else {
                tok = newToken(token.BANG, this.ch)
            }
            break
        case '/':
            tok = newToken(token.SLASH, this.ch)
            break
        case '*':
            tok = newToken(token.ASTERISK, this.ch)
            break
        case '<':
            tok = newToken(token.LT, this.ch)
            break
        case '>':
            tok = newToken(token.GT, this.ch)
            break
        case ';':
            tok = newToken(token.SEMICOLON, this.ch)
            break
        case ',':
            tok = newToken(token.COMMA, this.ch)
            break
        default:
            if (isLetter(this.ch)) {
                tok = newToken(token.IDENT, this.readIdentifier())
                return tok
            } else if (isDigit(this.ch)) {
                tok = newToken(token.INT, this.readNumber())
                return tok
            } else {
                tok = newToken(token.ILLEGAL, this.ch)
            }
    }

    this.readChar()
    return tok
}

function newToken(type, literal) {
    return new token.Token(type, literal)
}

Lexer.prototype.readIdentifier = function () {
    let position = this.position
    while (isLetter(this.ch)) {
        this.readChar()
    }
    return this.input.slice(position, this.position)
}
Lexer.prototype.skipWhitespace = function () {
    while (/\s/.test(this.ch)) {
        this.readChar()
    }
}

Lexer.prototype.peekChar = function () {
    if (this.readPosition >= this.input.length) {
        return '\0'
    } else {
        return this.input[this.readPosition]
    }
}

function lookupIdent(ident) {
    return Keywords[ident] || token.IDENT
}

Lexer.prototype.readNumber = function () {
    let position = this.position
    while (isDigit(this.ch)) {
        this.readChar()
    }
    return this.input.slice(position, this.position)
}

function isLetter(ch) {
    return /[a-zA-Z_]/.test(ch)
}

function isDigit(ch) {
    return /\d/.test(ch)
}

export function New(input) {
    const l = new Lexer(input)
    l.readChar()
    return l
}

function testNextToken() {
    const input = `let five = 5;
let ten = 10;

let add = fn(x, y) {
  x + y;
};

let result = add(five, ten);
!-/*5;
5 < 10 > 5;

if (5 < 10) {
    return true;
} else {
    return flase;
}

10 == 10;
10 != 9;
`
    const l = New(input)

    let tok = null
    do {
        tok = l.NextToken()
        console.log(tok)
    } while (tok.Type != token.EOF)
}

testNextToken()
