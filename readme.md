# Writing an Interpreter in JavaScript

中文翻译：https://github.com/LixvYang/Writing-a-Interpreter-in-Go-Translation

## 项目结构

```
monkey/
├── token.ts      # Token 类型定义
├── lexer.ts      # 词法分析器
├── ast.ts        # AST 节点定义
├── parser.ts     # 语法分析器
├── object.ts     # 对象系统（求值结果的类型）
├── eval.ts       # 求值器
├── repl.ts       # 交互式 REPL
│
├── lexer.test.ts   # lexer 测试
├── parser.test.ts  # parser 测试
└── eval.test.ts    # evaluator 测试
```

## 安装依赖

```bash
yarn install
```

## 运行

### 启动 REPL

```bash
yarn repl
# 或
npx tsx monkey/repl.ts
```

### 运行测试

```bash
yarn test:lexer
yarn test:parser
yarn test:eval
```

### 直接运行任意 .ts 文件

项目使用 [tsx](https://github.com/privatenumber/tsx) 直接执行 TypeScript，无需编译步骤：

```bash
npx tsx monkey/<文件名>.ts
```

---

## 参考资料

[TypeScript outDir setting](https://stackoverflow.com/questions/45661027/typescript-outdir-setting-in-tsconfig-json-not-working)

[How to configure prettier?](https://glebbahmutov.com/blog/configure-prettier-in-vscode/)

How to debug TypeScript?
https://juejin.cn/post/6902333925562499086

supplementary reading material

https://people.montefiore.uliege.be/geurts/Cours/compil/2011/03-syntaxanalysis-3.pdf
https://www.javatpoint.com/lr-parser
