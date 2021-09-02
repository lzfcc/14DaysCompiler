import Lexer from './ast/Lexer'
import { ExprParser, OpPrecedenceParser } from './parser/ParserIntro'

function testLexer() {
    new Lexer('./test-lexer.stone').process()
}

function testExprParser() {
    const lexer = new Lexer('./test-expr.txt')
    lexer.process().then(() => {
        // const p = new ExprParser(lexer)
        const p = new OpPrecedenceParser(lexer)
        console.log(p.expression().toString())
    })
}

testExprParser()
