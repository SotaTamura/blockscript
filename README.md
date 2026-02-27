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
bs ファイルのパス
```

### コード例

```
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

#ブロック#
v = {
  a = 1
  b = 2
  a + b
}
print(v)

#関数#
add = function (a, b) {
  sum = a + b
  return sum
}
print(add(3, 4));

#即時関数#
(function () {
  print("Hello!")
})()

#条件分岐#
age = 16
age >= 18 ? {
  print("大人です")
} : {
  print("子供です")
}

beverage = age >= 20 ? "ビール" : "ジュース"
print(beverage)

#再帰#
fact = function (n) {
  n == 0 ? {
    return 1
  }

  return n * fact(n - 1)
};

print(fact(5))
```

## 内部アーキテクチャ

1.  **Tokenizer (`tokenizer.ts`)**: ソースコードをトークンのストリームに変換します。
2.  **Parser (`parser.ts`)**: トークンを抽象構文木 (AST) に変換します。
3.  **Evaluator (`evaluator.ts`)**: AST を再帰的に走査し、プログラムを実行します。
4.  **Interpreter (`interpreter.mts`)**: 各コンポーネントを統合するエントリポイントです。
