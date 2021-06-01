import Lexer from './Lexer'
import { ExprParser } from './ast/ASTree'

function testLexer() {
    new Lexer('./test-lexer.txt').process()
}

(function testExprParser () {
    const lexer = new Lexer('./test-expr.txt')
    lexer.process().then(() => {
        const p = new ExprParser(lexer)
        console.log(p.expression().toString())
    })
})()
