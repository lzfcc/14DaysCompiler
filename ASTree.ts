import { Type, Token } from './Token'
import { Environment } from './Environment'

export abstract class ASTree {
    protected _children: Array<ASTree>

    public abstract child(i: number): ASTree

    public abstract numChildren(): number

    public abstract location(): string

    public abstract eval(env: Environment)

    public abstract lookup(sym)
}

/**
 * 非叶子节点
 */
export class ASTList extends ASTree {
    constructor(children: Array<ASTree>) {
        super()
        this._children = children
    }

    public children(): Array<ASTree> {
        // Iterator ?
        return this._children
    }

    public child(i: number): ASTree {
        return this._children[i]
    }

    public numChildren(): number {
        return this._children.length
    }

    public toString(): string {
        const arr = []
        arr.push('(')
        let seq = ''
        for (const t of this._children) {
            arr.push(seq)
            seq = ''
            arr.push(t.toString())
        }
        arr.push(')')
        return arr.join('')
    }

    public location(): string {
        for (const t of this._children) {
            const s = t.location()
            if (s) {
                return s
            }
        }
        return null
    }

    public eval(env) {
        throw new Error('cannot eval: ' + this.toString())
    }

    public lookup(sym) {
        // for (const t of this) {
        //     t.lookup(sym);
        // }
    }
}

/*
 * 叶子节点
 */
export class ASTLeaf extends ASTree {
    protected _token: Token

    constructor(token: Token) {
        super()
        this._token = token
        this._children = []
    }

    public child(i: number): ASTree {
        throw new Error('Index Out Of Bounds')
    }

    public numChildren(): number {
        return 0
    }

    public toString(): string {
        return this._token.getText()
    }

    public location(): string {
        return 'at line ' + this._token.getLineNumber()
    }

    public children(): Array<ASTree> {
        return this._children
    }

    public token(): Token {
        return this._token
    }

    public eval(env) {
        throw new Error('cannot eval: ' + this.toString())
    }

    public lookup(sym) {
        //        throw new StoneException("not implements");
    }
}

/**
 * 双目操作符
 */
export class BinaryExpr extends ASTList {
    constructor(children: Array<ASTree>) {
        super(children)
    }

    public left(): ASTree {
        return this.child(0)
    }

    public operator(): string {
        const leaf = this.child(1) as ASTLeaf
        return leaf.token().getText()
    }

    public right(): ASTree {
        return this.child(2)
    }

    public eval(env) {
        const op = this.operator()
        if ('=' === op) {
            const right = this.right().eval(env)
            return this.computeAssign(env, right)
        }

        const left = this.left().eval(env)
        const right = this.right().eval(env)
        return this.computeOp(left, op, right)
    }

    public lookup(syms) {
        //     ASTree left = left();
        //     if ("=".equals(operator())) {
        //         if (left instanceof Name) {
        //             ((Name) left).lookupForAssign(syms);
        //             right().lookup(syms);
        //             return;
        //         }
        //     }
        //     left.lookup(syms);
        //     right().lookup(syms);
    }

    protected computeAssign(env, rvalue) {
        const left = this.left() as Name
        try {
            if (left instanceof Name) {
                //((Name)left).evalForAssign(env, rvalue);
                env.put(left.name(), rvalue)
                return rvalue
            }
        } catch (e) {
            throw new Error('bad assignment ' + this)
        }

        // if (left instanceof PrimaryExpr) {
        //     const p = left as PrimaryExpr
        //     if (p.hasPostfix(0) && p.postfix(0) instanceof Dot) {
        //         const t = p.evalSubExpr(env, 1)
        //         if (t instanceof StoneObject) {
        //             return this.setField(t, p.postfix(0), rvalue)
        //         }
        //     }

        //     if (p.hasPostfix(0) && p.postfix(0) instanceof Array) {
        //         const a = (left as PrimaryExpr).evalSubExpr(env, 1)
        //         if (a instanceof Object[]) {
        //             const ref = p.postfix(0);
        //             const index = ref.index().eval(env)
        //             if (typeof index === 'number') {
        //                 a[i] = rvalue
        //                 return rvalue
        //             }
        //         }

        //         throw new Error("bad array access", this);
        //     }
        // }

        throw new Error('bad assignment')
    }

    protected computeOp(left: any, op: string, right: any) {
        if (typeof left === 'number' && typeof right === 'number') {
            return this.computeNumber(left, op, right)
        }

        if (op === '+') {
            return String(left) + String(right)
        }

        if (op === '==') {
            return left == right ? 1 : 0
        }

        throw new Error('bad type')
    }

    protected computeNumber(left: number, op: string, right: number) {
        if (op === '+') {
            return left + right
        }

        if (op === '-') {
            return left - right
        }

        if (op === '*') {
            return left * right
        }

        if (op === '/') {
            return left / right
        }

        if (op === '%') {
            return left % right
        }

        if (op === '==') {
            return left === right ? 1 : 0
        }

        if (op === '!=') {
            return left !== right ? 1 : 0
        }

        if (op === '>') {
            return left > right ? 1 : 0
        }

        if (op === '<') {
            return left < right ? 1 : 0
        }

        if (op === '>=') {
            return left >= right ? 1 : 0
        }

        if (op === '<=') {
            return left <= right ? 1 : 0
        }

        throw new Error('bad operator ' + this)
    }

    // private Object setField(StoneObject obj, Dot expr, Object rvalue) {
    //     String name = expr.name();
    //     obj.write(name, rvalue);
    //     return rvalue;
    // }
}

export class NumberLiteral extends ASTLeaf {
    public value(): number {
        return this.token().getNumber()
    }
    public eval(env: Environment) {
        return this.value()
    }
}

export class StringLiteral extends ASTLeaf {
    public value(): string {
        return this.token().getText()
    }
    public eval(env: Environment) {
        return this.value()
    }
}

export class Name extends ASTLeaf {
    public name() {
        return this.token().getText()
    }
    public eval(env: Environment) {
        const value = env.get(this.name())
        if (value === undefined) {
            throw new Error('undefined name: ' + this.name()) // StoneError
        } else {
            return value
        }
    }
}

export class WhileStmnt extends ASTList {
    public condition(): ASTree {
        return this.child(0)
    }
    public body(): ASTree {
        return this.child(1)
    }
    public toString() {
        return `(while ${this.condition()} ${this.body()})`
    }
    public eval(env: Environment) {
        let res = 0
        while (1) {
            const c = this.condition().eval(env)
            if (typeof c === 'number' && !c) {
                return res
            }
            res = this.body().eval(env)
        }
    }
}

export class BlockStmnt extends ASTList {
    public eval(env: Environment) {
        let res = 0
        for (const t of this.children()) {
            if (!(t instanceof NullStmnt)) {
                res = t.eval(env)
            }
        }
        return res
    }
}

export class NullStmnt extends ASTList {}

export class IfStmnt extends ASTList {
    public condition(): ASTree {
        return this.child(0)
    }
    public thenBlock(): ASTree {
        return this.child(1)
    }
    public elseBlock(): ASTree {
        return this.numChildren() > 2 ? this.child(2) : null
    }
    public toString() {
        return `(if${this.condition()} ${this.thenBlock()} else ${this.elseBlock()})`
    }
    public eval(env: Environment) {
        const c = this.condition().eval(env)
        if (typeof c === 'number' && c) {
            return this.thenBlock().eval(env)
        }
        const eb = this.elseBlock()
        if (!eb) {
            return 0
        }
        return eb.eval(env)
    }
}

export class PrimaryExpr extends ASTList {
    public static create(list: Array<ASTree>): ASTree {
        return list.length == 1 ? list[0] : new PrimaryExpr(list)
    }
}

export class NegativeExpr extends ASTList {
    public operand(): ASTree {
        return this.child(0)
    }
    public toString() {
        return '-' + this.operand()
    }
    public eval(env: Environment) {
        const value = this.operand().eval(env)
        if (typeof value === 'number') {
            return -value
        }
        throw new Error('bad type for -' + this)
    }
}
