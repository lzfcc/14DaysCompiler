import { Lexer } from './lexer'
import * as token from './token'

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
    const l = new Lexer(input)

    let tok: token.Token = null
    do {
        tok = l.nextToken()
        console.log(tok)
    } while (tok.type != token.EOF)
}

testNextToken()

function testNewOperators() {
    const input = `2 ** 3;
a && b;
x || y;
~z;
a & b;
c | d;
e ^ f;
`
    const expected: [token.TokenType, string][] = [
        [token.INT,       '2'],
        [token.POWER,     '**'],
        [token.INT,       '3'],
        [token.SEMICOLON, ';'],
        [token.IDENT,     'a'],
        [token.AND,       '&&'],
        [token.IDENT,     'b'],
        [token.SEMICOLON, ';'],
        [token.IDENT,     'x'],
        [token.OR,        '||'],
        [token.IDENT,     'y'],
        [token.SEMICOLON, ';'],
        [token.TILDE,     '~'],
        [token.IDENT,     'z'],
        [token.SEMICOLON, ';'],
        [token.IDENT,     'a'],
        [token.AMPERSAND, '&'],
        [token.IDENT,     'b'],
        [token.SEMICOLON, ';'],
        [token.IDENT,     'c'],
        [token.PIPE,      '|'],
        [token.IDENT,     'd'],
        [token.SEMICOLON, ';'],
        [token.IDENT,     'e'],
        [token.CARET,     '^'],
        [token.IDENT,     'f'],
        [token.SEMICOLON, ';'],
        [token.EOF,       '\0'],
    ]

    const l = new Lexer(input)
    let pass = true
    for (const [expectedType, expectedLiteral] of expected) {
        const tok = l.nextToken()
        if (tok.type !== expectedType || tok.literal !== expectedLiteral) {
            console.error(`FAIL: expected [${expectedType}, ${JSON.stringify(expectedLiteral)}], got [${tok.type}, ${JSON.stringify(tok.literal)}]`)
            pass = false
        }
    }
    if (pass) console.log('testNewOperators: all passed')
}

testNewOperators()
