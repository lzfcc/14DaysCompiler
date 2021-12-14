import * as readline from 'readline'
import { stdin, stdout } from 'process'
import * as lexer from './lexer'
import * as token from './token'
import Parser from './parser'

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
            console.log(programe)
            console.log(programe.string())
            repl()
        })
    }

    repl()
}

Start(stdin, stdout)
