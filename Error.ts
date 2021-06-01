import { Token } from './Token'

export class ParseError extends Error {
    // cannot use location method in constructor, since 'this' is an instance of Error
    // constructor(t?: Token, msg?: string) {
    //     super('')
    //     this.message = 'syntax error around ' + this.location(t) + '. ' + msg
    // }
    // private location(t: Token) {
    //     if (t == Token.EOF) return 'the last line'
    //     else return '"' + t.getText() + '" at line ' + t.getLineNumber()
    // }
    constructor(t?: Token, msg?: string) {
        super('')

        const loc =
            t == Token.EOF
                ? 'the last line'
                : '"' + t.getText() + '" at line ' + t.getLineNumber()
        this.message = 'syntax error around ' + loc + '. ' + msg
    }
}
