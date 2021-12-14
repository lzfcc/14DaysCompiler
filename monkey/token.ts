// type TokenType string

import { isObject } from "util"

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

// extended by me
export const MODULO = '%'
export const COMMNET = '#'
// and more: & | ~ ^ && || ...

// An interesting fact:
// In Chrome, we cannot evaluate -3**2, an error is thrown: 
// Uncaught SyntaxError: Unary operator used immediately before exponentiation expression. Parenthesis must be used to disambiguate operator precedence.
// see: https://stackoverflow.com/questions/43556752/why-is-12-a-syntax-error-in-javascript

export const LT = '<'
export const GT = '>'
export const EQ = '=='
export const NOT_EQ = '!='

export class Token {
    type: TokenType
    literal: string
    constructor (type, literal) {
        this.type = type
        this.literal = literal
    }
}
