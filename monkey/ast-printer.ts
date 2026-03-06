import * as ast from './ast'

interface TreeNode {
    label: string
    children: TreeNode[]
}

function leaf(label: string): TreeNode {
    return { label, children: [] }
}

function branch(label: string, ...children: TreeNode[]): TreeNode {
    return { label, children }
}

function nodeToTree(node: ast.Node): TreeNode {
    if (node instanceof ast.Program) {
        return branch('Program', ...node.statements.map(nodeToTree))
    }
    if (node instanceof ast.LetStatement) {
        return branch('LetStatement', nodeToTree(node.name), branch('=', nodeToTree(node.value)))
    }
    if (node instanceof ast.ReturnStatement) {
        return branch('ReturnStatement', nodeToTree(node.returnValue))
    }
    if (node instanceof ast.ExpressionStatement) {
        return branch('ExpressionStatement', nodeToTree(node.expression))
    }
    if (node instanceof ast.BlockStatement) {
        return branch('BlockStatement', ...node.statements.map(nodeToTree))
    }
    if (node instanceof ast.Identifier) {
        return leaf(`Identifier(${node.value})`)
    }
    if (node instanceof ast.IntegerLiteral) {
        return leaf(`IntegerLiteral(${node.value})`)
    }
    if (node instanceof ast.Bool) {
        return leaf(`Bool(${node.value})`)
    }
    if (node instanceof ast.PrefixExpression) {
        return branch(`Prefix(${node.operator})`, nodeToTree(node.right))
    }
    if (node instanceof ast.InfixExpression) {
        return branch(`Infix(${node.operator})`, nodeToTree(node.left), nodeToTree(node.right))
    }
    if (node instanceof ast.IfExpression) {
        const children: TreeNode[] = [
            branch('condition', nodeToTree(node.condition)),
            branch('consequence', nodeToTree(node.consequence)),
        ]
        if (node.alternative) {
            children.push(branch('alternative', nodeToTree(node.alternative)))
        }
        return branch('IfExpression', ...children)
    }
    if (node instanceof ast.WhileExpression) {
        return branch('WhileExpression',
            branch('condition', nodeToTree(node.condition)),
            branch('body', nodeToTree(node.body)),
        )
    }
    if (node instanceof ast.FunctionLiteral) {
        const params = branch('params', ...node.parameters.map(nodeToTree))
        const body = branch('body', nodeToTree(node.body))
        return branch('FunctionLiteral', params, body)
    }
    if (node instanceof ast.CallExpression) {
        const args = branch('args', ...node.args.map(nodeToTree))
        return branch('CallExpression', nodeToTree(node.func), args)
    }
    return leaf(`Unknown(${node.tokenLiteral()})`)
}

function renderTree(node: TreeNode, prefix: string | null = null, isLast = true): string {
    if (prefix === null) {
        // root: no connector, children start with empty prefix
        let result = node.label + '\n'
        node.children.forEach((child, i) => {
            result += renderTree(child, '', i === node.children.length - 1)
        })
        return result
    }
    const connector = isLast ? '└── ' : '├── '
    const extension = isLast ? '    ' : '│   '
    let result = prefix + connector + node.label + '\n'
    node.children.forEach((child, i) => {
        result += renderTree(child, prefix + extension, i === node.children.length - 1)
    })
    return result
}

export function printAST(program: ast.Program): void {
    console.log(renderTree(nodeToTree(program)))
}
