import * as readline from 'readline'
import { stdin, stdout } from 'process'
import * as lexer from './lexer'
import * as token from './token'

const PROMPT = '>> '

function Start(input, output) {
    const rl = readline.createInterface({ input, output })
    console.log('This is the Monkey programming language!\nFeel free to type in commands')

    // https://nodejs.org/api/readline.html#rlpromptpreservecursor
    function repl() {
        rl.question(PROMPT, (line) => {
            const l = lexer.New(line)
            let i = 0
            for (let tok = l.NextToken(); tok.Type != token.EOF; tok = l.NextToken()) {
                console.log(tok) // rl.out??
            }

            repl()
        })
    }

    repl()
}

Start(stdin, stdout)
