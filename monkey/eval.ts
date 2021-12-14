import * as object from './object'
import * as ast from './ast'
import * as lexer from './lexer'
import Parser from './parser'

const TRUE = new object.Bool(true)
const FALSE = new object.Bool(false)
const NULL = new object.Null()

export function Eval(node: ast.Node): object.MObject {
    if (node instanceof ast.Program) {
        return evalStatement(node.statements)
    }
    if (node instanceof ast.ExpressionStatement) {
        return Eval(node.expression)
    }
    if (node instanceof ast.IntegerLiteral) {
        return new object.Int(node.value)
    }
    if (node instanceof ast.Bool) {
        return node.value ? TRUE : FALSE // new object.Bool(node.value)
    }
    if (node instanceof ast.PrefixExpression) {
        const right = Eval(node.right)
        if (node.operator === '!') {
            return evalBangOperatorExpression(right)
        }
        if (node.operator === '-') {
            return evalNegativeOperatorExpression(right)
        }
        return NULL
    }

    function evalStatement(stmts: ast.Statement[]): object.MObject {
        let res = null
        for (const stmt of stmts) {
            res = Eval(stmt)
        }
        return res
    }

    function evalBangOperatorExpression(expr: object.MObject): object.MObject {
        if (expr instanceof object.Int) {
            return (expr as object.Int).value ? FALSE : TRUE
        } else if (expr === FALSE || expr === NULL) {
            return TRUE
        } else {
            return FALSE
        }
    }

    function evalNegativeOperatorExpression(expr: object.MObject): object.MObject {
        if (expr !== NULL) {
            return new object.Int(-expr.value)
        }
    }

    return null
}

function testEval(input: string): object.MObject {
    const l = new lexer.Lexer(input)
    const p = new Parser(l)
    const program = p.parseProgram()

    return Eval(program)
}

// testEval('5')

// No, this is not supported!
testEval('-!0')
testEval('!-1')