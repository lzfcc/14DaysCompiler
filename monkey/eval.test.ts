import * as lexer from './lexer'
import Parser from './parser'
import * as object from './object'
import { Eval } from './eval'

function testEval(input: string): object.MObject {
    const l = new lexer.Lexer(input)
    const p = new Parser(l)
    const program = p.parseProgram()
    const env = new object.Environment()

    return Eval(program, env)
}

console.log(testEval('5'))
console.log(testEval('-!0'))
console.log(testEval('!-1'))
console.log(testEval('3 * true'))
console.log(testEval('12 % 5'))
console.log(testEval('if (5 * 5 + 10 > 34) { 99 } else { 100 }'))
console.log(testEval('let a = 5; let b = 2 * a; a = a + b; return a + b'))
console.log(testEval('let a = 5; let b = 2 * a; let c = a;'))
console.log(testEval('let add = fn(a, b) { a + b }; add(2, 3);'))
console.log(testEval('let add = fn(a, b) { a + b };let sub = fn(a, b) { a - b };let applyFunc = fn(a, b, func) { func(a, b) };applyFunc(2, 3, add);applyFunc(2, 3, sub);'))
console.log(testEval('let a = 5; let b = 2 * a; while(a < b) {a = a + 1;}'))
