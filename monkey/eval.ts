import * as object from './object'
import * as ast from './ast'
import * as lexer from './lexer'
import Parser from './parser'

const TRUE = new object.Bool(true)
const FALSE = new object.Bool(false)
const NULL = new object.Null()

export function Eval(node: ast.Node, env: object.Environment): object.MObject {
    if (node instanceof ast.Program) {
        return evalStatements(node.statements)
    }
    if (node instanceof ast.ExpressionStatement) {
        return Eval(node.expression, env)
    }
    if (node instanceof ast.IntegerLiteral) {
        return new object.Int(node.value)
    }
    if (node instanceof ast.Bool) {
        return nativeBoolToObject(node.value) // new object.Bool(node.value)
    }
    if (node instanceof ast.PrefixExpression) {
        const right = Eval(node.right, env)
        if (node.operator === '!') {
            return evalBangOperatorExpression(right)
        }
        if (node.operator === '-') {
            return evalNegativeOperatorExpression(right)
        }
        return new object.MError(
            `unknown operator: ${node.operator} ${right.type()}`
        )
        // return NULL
    }
    if (node instanceof ast.InfixExpression) {
        if (node.operator == '=') {
            return evalAssignExpression(
                'assign',
                node.left as ast.Identifier,
                node.right,
                env
            )
        }
        const left = Eval(node.left, env)
        const right = Eval(node.right, env)
        return evalInfixExpression(node.operator, left, right)
    }
    if (node instanceof ast.IfExpression) {
        return evalIfExpression(node, env)
    }
    if (node instanceof ast.BlockStatement) {
        return evalStatements(node.statements)
    }
    if (node instanceof ast.ReturnStatement) {
        const val = Eval(node.returnValue, env)
        return new object.ReturnValue(val)
    }
    if (node instanceof ast.LetStatement) {
        return evalAssignExpression('let', node.name, node.value, env)
    }
    if (node instanceof ast.Identifier) {
        return evalIdentifier(node, env)
    }

    function evalStatements(stmts: ast.Statement[]): object.MObject {
        let res = null
        for (const stmt of stmts) {
            res = Eval(stmt, env)
            if (res instanceof object.MError) {
                return res
            }
            if (res instanceof object.ReturnValue) {
                return res.primitive
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

    function evalNegativeOperatorExpression(
        expr: object.MObject
    ): object.MObject {
        if (expr !== NULL) {
            return new object.Int(-expr.primitive)
        }
    }

    function evalInfixExpression(
        op: string,
        left: object.MObject,
        right: object.MObject
    ): object.MObject {
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
        return new object.MError(
            `unknown operator: ${left.type()} ${op} ${right.type()}`
        )
        // return NULL
    }

    function nativeBoolToObject(input: boolean): object.Bool {
        return input ? TRUE : FALSE
    }

    function evalIfExpression(
        ie: ast.IfExpression,
        env: object.Environment
    ): object.MObject {
        const condition = Eval(ie.condition, env)
        if (condition.valueOf()) {
            return Eval(ie.consequence, env)
        } else if (ie.alternative) {
            return Eval(ie.alternative, env)
        } else {
            return NULL
        }
    }

    function evalIdentifier(
        node: ast.Identifier,
        env: object.Environment
    ): object.MObject {
        const val = env.get(node.value)
        if (val === undefined) {
            return new object.MError('identifier not found: ' + node.value)
        }
        return val
    }

    function evalAssignExpression(
        mode: 'assign' | 'let',
        left: ast.Identifier,
        right: ast.Expression,
        env: object.Environment
    ): object.MObject {
        if (left instanceof ast.Identifier == false) {
            return new object.MError(
                'left operand in assign expression to a non-identifier.'
            )
        }
        if (mode == 'let' && env.get(left.value) !== undefined) {
            return new object.MError(
                `identifier ${left.value} is already declared.`
            )
        }
        if (mode == 'assign' && env.get(left.value) === undefined) {
            return new object.MError(
                `identifier ${left.value} is not declared yet.`
            )
        }
        const val = Eval(right, env)
        if (val instanceof object.MError) {
            return val
        }
        env.set(left.value, val)
        return val
    }

    return null
}

function testEval(input: string): object.MObject {
    const l = new lexer.Lexer(input)
    const p = new Parser(l)
    const program = p.parseProgram()
    const env = new object.Environment()

    return Eval(program, env)
}

// testEval('5')
// testEval('-!0')
// testEval('!-1')
// testEval('3 * true')
// testEval('12 % 5')
// testEval('if (5 * 5 + 10 > 34) { 99 } else { 100 }')
// testEval('let a = 5; let b = 2 * a; a = a + b; return a + b')
testEval('let a = 5; let b = 2 * a; let c = a;')
