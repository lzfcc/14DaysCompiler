export enum Type {
    unknown = 0,
    number = 1,
    string = 2,
    identifier = 3,
}

export class Token {
    public static EOF = new Token(-1)

    // 换行
    public static EOL = '\n'

    private readonly lineNumber = 0

    constructor(lineNumber) {
        this.lineNumber = lineNumber
    }

    get type(): Type {
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
}

export class NumToken extends Token {
    private value = 0

    constructor(lineNumber, value) {
        super(lineNumber)
        this.value = value
    }

    public get type() {
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

    public get type() {
        return Type.identifier
    }

    public getText() {
        return this.name
    }
}

export class StrToken extends Token {
    private value = ''

    constructor(lineNumber, value) {
        super(lineNumber)
        this.value = value
    }

    public get type() {
        return Type.string
    }

    public getText() {
        return this.value
    }
}
