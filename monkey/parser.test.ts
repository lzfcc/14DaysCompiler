import * as lexer from './lexer'
import Parser from './parser'
import * as ast from './ast'
import { printAST } from './ast-printer'

const PRINT_AST = process.env.PRINT_AST === '1'

/**
 * # 普通运行，只打印 string()
npx tsx monkey/parser.test.ts

# 开启 AST 树输出
PRINT_AST=1 npx tsx monkey/parser.test.ts
 */


function TestLetStatements() {
    const input = `
let x = 5;
let y = 10;
let foobar = -883;
`
    const l = new lexer.Lexer(input)
    const p = new Parser(l)
    const program = p.parseProgram()

    if (!program) {
        console.error('ParseProgram() returned nil')
    }
    if (program.statements.length !== 3) {
        console.error(
            `program.Statements does not contain 3 statements. got=${program.statements.length}`
        )
    }

    const tests = ['x', 'y', 'foobar']

    tests.forEach((tt, i) => {
        const stmt = program.statements[i]
        testLetStatement(stmt, tt)
    })

    function testLetStatement(s: ast.Statement, name: string): boolean {
        if (s.tokenLiteral() !== 'let') {
            console.error(`s.TokenLiteral not 'let'. got=${s.tokenLiteral()}`)
            return false
        }

        if (s instanceof ast.LetStatement === false) {
            console.error(`s not *ast.LetStatement. got=${s}`)
            return false
        }

        let letStmt = s as ast.LetStatement
        if (letStmt.name.value != name) {
            console.error(
                `letStmt.Name.Value not '${name}'. got=${letStmt.name.value}`
            )
            return false
        }

        if (letStmt.name.tokenLiteral() != name) {
            console.error(`letStmt.Name not '${name}'. got=${letStmt.name}`)
            return false
        }

        return true
    }
}

function TestReturnStatement() {
    const input = `
    return 5;
    return 10;
    return 993322;
`
    const l = new lexer.Lexer(input)
    const p = new Parser(l)

    const program = p.parseProgram()

    if (program.statements.length !== 3) {
        console.error(
            `program.Statements does not contain 3 statements. got=${program.statements}`
        )
    }

    for (const stmt of program.statements) {
        if (stmt instanceof ast.ReturnStatement == false) {
            console.error(`stmt not *ast.returnStatement. got=${stmt}`)
            continue
        }
        if (stmt.tokenLiteral() != 'return') {
            console.error(
                `returnStmt.TokenLiteral not 'return', got ${stmt.tokenLiteral()}`
            )
        }
    }
}

function ParserGeneralTest(scenario, input: string | string[]) {
    const tester = (input) => {
        const l = new lexer.Lexer(input)
        const p = new Parser(l)
        const program = p.parseProgram()

        console.log(`scenario: ${scenario}`)
        console.log(program.string())
        if (PRINT_AST) printAST(program)
    }

    if (Array.isArray(input)) {
        input.forEach((i) => tester(i))
    } else {
        tester(input)
    }
}

TestLetStatements()
TestReturnStatement()

ParserGeneralTest('IdentifierExpression', 'foobar;')

ParserGeneralTest('IntegerLiteralExpression', '2021;')

ParserGeneralTest('PrefixExpressions', [
    '!foobar',
    '-20',
    '!true',
])

ParserGeneralTest('InfixExpressions', [
    '5 + 5;',
    '5 - 5;',
    '5 * 5;',
    '5 / 5;',
    '5 > 5;',
    '5 < 5;',
    '5 == 5;',
    '5 != 5;'
])

ParserGeneralTest('InfixExpressions', [
    '-a + b;',
    '!-a;',
    'a + b - c;',
    '4 * 5 / 2; 1 + 2',
    '2 + 1 * 3 + 5',
    '5 > 5 == 2 < 3;',
    '5 < 5 != 4 > 2;',
    '5 * 2 == 5 + 5',
    '3 > 2 == 4 == 0', // ((3 > 2) == 4) == 0 => true
    '0 * 1 == 1 > 1', // (0 * 1) == (1 > 1) => true

    '!true',
    'true == false',
    '1 > 2 != true',

    '(1 + 2) * 3',
    '-(3 + 4)',
    '!(true == false)'
])

ParserGeneralTest('if-else expressions', [
    'if (x < y) { x }',
    'if (x < y) { x } else { y }'
])

// extended by me
ParserGeneralTest('assign expression', 'x = a / 2 + 1')
ParserGeneralTest('if-else expressions with statement', [
    'if (x < y) { x }',
    'if (x < y) { x = y == x / 2; } else { x = x + y; y = !foo(x); }'
])

ParserGeneralTest('function literal', [
    'fn(){};',
    'fn(x){};',
    'fn(x, y) { return x - y };'
])

ParserGeneralTest('call function', [
    'add(2, 3)',
    'foo(a * 4, 1, 5 - bar(3))',
    'a + mul(a * b) / c'
])

ParserGeneralTest('group expression', [
    '(5 + 5) * 2',
    '((a > b))',
])


function TestOperatorPrecedenceParsing() {
    const tests: [string, string][] = [
        ['-a * b',                          '((-a) * b)'],
        ['!-a',                             '(!(-a))'],
        ['a + b + c',                       '((a + b) + c)'],
        ['a + b / c',                       '(a + (b / c))'],
        ['a + b * c + d / e - f',           '(((a + (b * c)) + (d / e)) - f)'],
        ['3 + 4; -5 * 5',                  '(3 + 4)((-5) * 5)'],
        // grouping with parentheses overrides default precedence
        ['(a + b) * c',                     '((a + b) * c)'],
        ['a * (b + c)',                      '(a * (b + c))'],
        ['(a + b) / (c - d)',               '((a + b) / (c - d))'],
        ['-(a + b)',                         '(-(a + b))'],
        ['!(a != b)',                        '(!(a != b))'],
        ['5 > 4 == 3 < 4',                 '((5 > 4) == (3 < 4))'],
        ['3 + 4 * 5 == 3 / 1 + 4 * 5',    '((3 + (4 * 5)) == ((3 / 1) + (4 * 5)))'],
    ]

    let pass = true
    for (const [input, expected] of tests) {
        const p = new Parser(new lexer.Lexer(input))
        const program = p.parseProgram()
        if (PRINT_AST) printAST(program)

        if (p.errors.length > 0) {
            console.error(`parser errors for "${input}":`, p.errors)
            pass = false
            continue
        }

        const actual = program.string()
        if (actual !== expected) {
            console.error(`FAIL "${input}": expected "${expected}", got "${actual}"`)
            pass = false
        }
    }
    if (pass) console.log('TestOperatorPrecedenceParsing: all passed')
}

TestOperatorPrecedenceParsing()