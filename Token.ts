export enum Type {
    unknown = 0,
    number = 1,
    string = 2,
    identifier = 3,
}

export abstract class Token {
    public static EOF = new (class EOFToken extends Token {
        public getText(): string {
            return 'EOF'
        }
    })(-1)

    // 换行
    public static EOL = '\n'

    private readonly lineNumber = 0

    constructor(lineNumber) {
        this.lineNumber = lineNumber
    }

    public getType(): Type {
        return Type.unknown
    }

    // 数字字面量
    public getNumber(): number {
        throw new Error('not number token')
    }

    // 节点文本
    public getText(): string {
        return ''
    }

    public getLineNumber() {
        return this.lineNumber
    }
}

export class NumToken extends Token {
    private value = 0

    constructor(lineNumber, value) {
        super(lineNumber)
        this.value = value
    }

    public getType() {
        return Type.number
    }

    public getText() {
        return String(this.value)
    }

    public getNumber() {
        return this.value
    }
}

export class IdToken extends Token {
    private name = ''

    constructor(lineNumber, name) {
        super(lineNumber)
        this.name = name
    }

    public getType() {
        return Type.identifier
    }

    public getText() {
        if (this.name === Token.EOL) {
            return 'EOL'
        }
        return this.name
    }
}

export class StrToken extends Token {
    private value = ''

    constructor(lineNumber, value) {
        super(lineNumber)
        this.value = value
    }

    public getType() {
        return Type.string
    }

    public getText() {
        return this.value
    }
}
