import * as fs from 'fs'
import * as readline from 'readline'

import { Token, NumToken, StrToken, IdToken } from './Token'

const commentRegExp = '//.*'
const numRegExp = '\\d+'
const strRegExp = '"(\\"|\\\\|\\n|[^\"])*"'
const idRegExp = '[A-Z_a-z][A-Z_a-z0-9]*|==|<=|>=|&&|\|\||' +
	 '[^A-Za-z0-9\s]'
// java \p{Punct} => Punctuation: One of !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
// https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
const regexPattern = `\\s*((${commentRegExp})|(${numRegExp})|(${strRegExp})|(${idRegExp}))?`

class Lexer {

	// 存放每行读取的token
	private queue: Token[] = []
	private hasMore: boolean
	private reader

	constructor (filePath) {
		this.hasMore = true
		this.reader = readline.createInterface({
			input: fs.createReadStream(filePath),
			crlfDelay: Infinity
		})
		// Note: we use the crlfDelay option to recognize all instances of CR LF ('\r\n') in input.txt as a single line break.
	}

	public read (): Token {
		try {
			if (this.fillQueue(0)) {
				return this.queue.shift()
			}
		} catch (e) {

		}

		return Token.EOF;
	}

	/**
	 * 预读, 返回read 方法即将返回的单词之后的第i 个单词
	 *
	 * @param i 单词位置
	 * @return 返回一个单词
	 */
	public peek (i): Token {
		if (this.fillQueue(i)) {
			return this.queue[i]
		}

		return Token.EOF
	}

	private fillQueue(i): boolean {
		try {
			while (i >= this.queue.length) {
				if (this.hasMore) {
					this.readLine('', 0)
				} else {
					return false
				}
			}
		} catch (e) {

		}
		return true
	}

	public process () {
		let lineNumber = 1
		this.reader.on('line', (line) => {
			console.log('Line from file:', line)
			lexer.readLine(line, lineNumber++)
		})
	}

	private readLine (line: string, lineNumber: number) {
		let match
		const pattern = new RegExp(regexPattern, 'g')
		while (match = pattern.exec(line)) {
  			// console.log('Found ' + myArray[1])
			this.addToken(lineNumber, match)
			if (pattern.lastIndex >= line.length) {
				break
			}
		}
		this.queue.push(new IdToken(lineNumber, Token.EOL))
	}

	private addToken(lineNo, match) {
		const m = match[1]
		if (m?.trim()) {    // if not a space
			if (!match[2]) {     // if not a comment
				let token = null
				if (match[3]) {
					token = new NumToken(lineNo, Number(m))
				} else if (match[4]) {
					token = new StrToken(lineNo, m)
				} else {
					token = new IdToken(lineNo, m)
				}
				this.queue.push(token)
			}
		}
	}

}

// test
const lexer = new Lexer('./input.txt')
lexer.process()
