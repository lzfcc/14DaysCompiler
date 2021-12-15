import * as object from './object'
import * as ast from './ast'
import * as lexer from './lexer'
import Parser from './parser'

const TRUE = new object.Bool(true)
const FALSE = new object.Bool(false)
const NULL = new object.Null()

export function Eval(node: ast.Node): object.MObject {
    if (node instanceof ast.Program) {
        return evalStatements(node.statements)
    }
    if (node instanceof ast.ExpressionStatement) {
        return Eval(node.expression)
    }
    if (node instanceof ast.IntegerLiteral) {
        return new object.Int(node.value)
    }
    if (node instanceof ast.Bool) {
        return nativeBoolToObject(node.value) // new object.Bool(node.value)
    }
    if (node instanceof ast.PrefixExpression) {
        const right = Eval(node.right)
        if (node.operator === '!') {
            return evalBangOperatorExpression(right)
        }
        if (node.operator === '-') {
            return evalNegativeOperatorExpression(right)
        }
        return new object.MError(`unknown operator: ${node.operator} ${right.type()}`)
        // return NULL
    }
    if (node instanceof ast.InfixExpression) {
        const left = Eval(node.left)
        const right = Eval(node.right)
        return evalInfixExpression(node.operator, left, right)
    }
    if (node instanceof ast.IfExpression) {
        return evalIfExpression(node)
    }
    if (node instanceof ast.BlockStatement) {
        return evalStatements(node.statements)
    }

    function evalStatements(stmts: ast.Statement[]): object.MObject {
        let res = null
        for (const stmt of stmts) {
            res = Eval(stmt)
            if (res instanceof object.MError) {
                return res
            }
        }
        return res
    }

    function evalBangOperatorExpression(expr: object.MObject): object.MObject {
        if (expr instanceof object.Int) {
            return (expr as object.Int).primitive ? FALSE : TRUE
        } else if (expr === FALSE || expr === NULL) {
            return TRUE
        } else {
            return FALSE
        }
    }

    function evalNegativeOperatorExpression(expr: object.MObject): object.MObject {
        if (expr !== NULL) {
            return new object.Int(-expr.primitive)
        }
    }

    function evalInfixExpression(op: string, left: object.MObject, right: object.MObject): object.MObject {
        const lval = left.primitive
        const rval = right.primitive
        if (op === '<') {
            return nativeBoolToObject(lval < rval)
        }
        if (op === '>') {
            return nativeBoolToObject(lval > rval)
        }
        if (op === '==') {
            return nativeBoolToObject(lval == rval)
        }
        if (op === '!=') {
            return nativeBoolToObject(lval != rval)
        }
        if (op === '+') {
            return new object.Int(lval + rval)
        }
        if (op === '-') {
            return new object.Int(lval - rval)
        }
        if (op === '*') {
            return new object.Int(lval * rval)
        }
        if (op === '/') {
            return new object.Int(Math.floor(lval / rval))
        }
        if (op == '%') {
            return new object.Int(lval % rval)
        }
        return new object.MError(`unknown operator: ${left.type()} ${op} ${right.type()}`)
        // return NULL
    }

    function nativeBoolToObject(input: boolean): object.Bool {
        return input ? TRUE : FALSE
    }

    function evalIfExpression(ie: ast.IfExpression): object.MObject {
        const condition = Eval(ie.condition)
        if (condition.valueOf()) {
            return Eval(ie.consequence)
        } else if (ie.alternative) {
            return Eval(ie.alternative)
        } else {
            return NULL
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
// testEval('-!0')
// testEval('!-1')
// testEval('3 * true')
// testEval('12 % 5')
// testEval('if (5 * 5 + 10 > 34) { 99 } else { 100 }')