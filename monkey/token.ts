// type TokenType string

export type TokenType = string

export const ILLEGAL = 'ILLEGAL'
export const EOF = 'EOF'

// Identifiers + literals
export const IDENT = 'IDENT' // add, foobar, x, y,...
export const INT = 'INT' // 1343456

// Delimiters
export const COMMA = ','
export const SEMICOLON = ';'
export const LPAREN = '('
export const RPAREN = ')'
export const LBRACE = '{'
export const RBRACE = '}'

// Keywords
export const FUNCTION = 'FUNCTION'
export const LET = 'LET'
export const TRUE = 'TRUE'
export const FALSE = 'FALSE'
export const IF = 'IF'
export const ELSE = 'ELSE'
export const RETURN = 'RETURN'
export const WHILE = 'WHILE'

// Operators
export const ASSIGN = '='
export const PLUS = '+'
export const MINUS = '-'
export const BANG = '!'
export const ASTERISK = '*'
export const SLASH = '/'

export const LT = '<'
export const GT = '>'
export const EQ = '=='
export const NOT_EQ = '!='

// extended by me
export const MODULO = '%'
export const COMMENT = '#'

// Bitwise operators
export const AMPERSAND = '&'  // bitwise AND
export const PIPE = '|'       // bitwise OR
export const CARET = '^'      // bitwise XOR
export const TILDE = '~'      // bitwise NOT (unary)

// Logical operators (short-circuit)
export const AND = '&&'
export const OR = '||'

// Exponentiation
// Note: In JavaScript -3**2 is a syntax error (use (-3)**2 instead).
// We follow the same rule: ** binds tighter than unary minus.
// see: https://stackoverflow.com/questions/43556752/why-is-12-a-syntax-error-in-javascript
export const POWER = '**'


export class Token {
    type: TokenType
    literal: string
    constructor(type: TokenType, literal: string) {
        this.type = type
        this.literal = literal
    }
}
