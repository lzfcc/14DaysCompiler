import * as readline from 'readline'
import { stdin, stdout } from 'process'
import * as lexer from './lexer'
import * as token from './token'
import Parser from './parser'
import * as evaluator from './eval'

const PROMPT = '>> '

function Start(input, output) {
    const rl = readline.createInterface({ input, output })
    console.log('This is the Monkey programming language!\nFeel free to type in commands')

    // https://nodejs.org/api/readline.html#rlpromptpreservecursor
    function repl() {
        rl.question(PROMPT, (line) => {
            const l = new lexer.Lexer(line)
            const p = new Parser(l)
            const programe = p.parseProgram()
            const res = evaluator.Eval(programe)
            if (res) {
                console.log(res.inspect())
            }
            repl()
        })
    }

    repl()
}

Start(stdin, stdout)
