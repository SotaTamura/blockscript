# BlockScript (bs)

TypeScript と Node.js で構築された、シンプルで軽量なプログラミング言語インタープリターです。

## 特徴

- **基本演算**: `+`, `-`, `*`, `/`, `%` による算術演算。
- **論理演算**: AND (`&`), OR (`|`), NOT (`!`) 。
- **比較演算**: `==`, `!=`, `<`, `<=`, `>`, `>=`。
- **変数**: 自由な変数名への代入と更新。
- **関数**: `function` キーワードによる第一級関数の定義と `return` による値の返却。
- **基本型**: 数値 (Number)、文字列 (String)、ブール値 (Boolean: `true`/`false`)。
- **コメント**: `#`で囲ってコメント。

## インストール

`bs` コマンドをグローバルに使用できるようにするには、リポジトリをクローンして以下を実行します：

```bash
npm install
npm link
```

## 使い方

`.bs` 拡張子のファイルを `bs` コマンドで実行します：

```bash
bs main.bs
```

### コード例 (`main.bs`)

`main.bs` に記述されている基本的な使い方は以下の通りです。

```javascript
#出力#
print("Hello World!")

#演算子#
print(3 + 4 * 5)         #23#
print("Hello" + "World") #HelloWorld#

#変数#
mysteriousNumber = 0
mysteriousNumber = 2
print(mysteriousNumber)  #2#

#ブール値と論理演算#
print(true)         #true#
print(!false)       #true#
print(true & false) #false#
print(true | false) #true#

#比較演算子#
age = 14
print(age == 15) #false#
print(age == 14) #true#

#関数#
add = function (a, b) {
  sum = a + b
  return sum
}
print(add(3, 4)) #7#
```

## 内部アーキテクチャ

1.  **Tokenizer (`tokenizer.ts`)**: ソースコードをトークンのストリームに変換します。
2.  **Parser (`parser.ts`)**: トークンを抽象構文木 (AST) に変換します。
3.  **Evaluator (`evaluator.ts`)**: AST を再帰的に走査し、プログラムを実行します。
4.  **Interpreter (`interpreter.mts`)**: 各コンポーネントを統合するエントリポイントです。
