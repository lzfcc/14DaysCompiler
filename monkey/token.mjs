// type TokenType string

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

export function Token(type, literal) {
    // struct
    this.type = type
    this.literal = literal
}
