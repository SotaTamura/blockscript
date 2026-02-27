# BlockScript (bs)

TypeScript と Node.js で構築された、シンプルで軽量なプログラミング言語インタープリターです。

## 特徴

- **基本演算**: `+`, `-`, `*`, `/`, `%` による算術演算。
- **論理演算**: AND (`&`), OR (`|`), NOT (`!`) 。
- **比較演算**: `==`, `!=`, `<`, `<=`, `>`, `>=`。
- **変数**: 自由な変数名への代入と更新。レキシカルスコープをサポート。
- **関数**: `function` キーワードによる第一級関数の定義。`return` による値の返却（値なしも可）。
- **基本型**: 数値 (Number)、文字列 (String)、ブール値 (Boolean: `true`/`false`)。
- **配列 (List)**: `[...]` による配列の作成。インデックスによる要素の取得と更新（**1始まり**）。
- **ブロック**: `{ ... }` による処理のグループ化。最後に評価された値を返し、新しいスコープを作成します。
- **制御構文（式）**: すべての制御構文は値を返す「式」として扱われます。
  - **条件分岐**: `if (条件) 式 else 式` 。
  - **繰り返し**: `while (条件) 式` 。各ループの結果を配列として返します。
  - **反復**: `for (変数 in 配列) 式` 。配列の各要素を順に処理し、各ループの結果を配列として返します。
  - **関数脱出**: `return 式` 。関数から値を返して即座に終了します。
- **ジャンプ文**: `break`, `continue` による制御。
  - `break`, `continue` はオプションで値を返すことができ、ループの結果リストに含まれます。
  - 値を指定しない `continue` は、そのイテレーションの結果をスキップ（フィルタリング）するために使用できます。
- **再帰**: 関数による再帰呼び出しをサポート。
- **組み込み関数**: `print` 関数による標準出力。
- **コメント**: `#` で囲まれたテキストはコメントとして無視されます。

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
print(true)
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
print(v) #3#

#関数#
add = function (a, b) {
  sum = a + b
  return sum
}
print(add(3, 4)) #7#

divide = function (a, b) {
  if (b == 0) return;
  return a / b
}

print(divide(10, 2)) #5#
print(divide(10, 0)); #undefined#

#即時関数#
(function () {
  print("Hello!")
})()

#条件分岐#
age = 16
if (age >= 18) {
  print("大人です")
} else {
  print("子供です")
} #子供です#

beverage = if (age >= 20) "ビール" else "ジュース"
print(beverage) #ジュース#

#再帰#
fact = function (n) {
  if (n == 0) {
    return 1
  }

  return n * fact(n - 1)
};

print(fact(5)) #120#

#while文#
i = 0
while (i < 5) {
  print(i)
  i = i + 1
} #0 1 2 3 4#

i = 0

print(while (i < 6) {
  if (i == 3) break;
  i = i + 1
}) #[1, 2, 3]#

#配列#
studentNames = ["田中", "佐藤", "鈴木"]
print(studentNames[1]) #田中#
studentNames[2] = "内藤"
print(studentNames[2]) #内藤#

#for文#
text = ""

for (i in range(0, 9)) {
  if (i == 3) continue;
  text = text + i;
}

print(text) #012456789#

evens = for (i in range(1, 10)) if (i % 2 == 0) i
print(evens) #[2, 4, 6, 8, 10]#
```

## 内部アーキテクチャ

1.  **Tokenizer (`tokenizer.ts`)**: ソースコードをトークンのストリームに変換します。
2.  **Parser (`parser.ts`)**: トークンを抽象構文木 (AST) に変換します。
3.  **Evaluator (`evaluator.ts`)**: AST を再帰的に走査し、プログラムを実行します。
4.  **Interpreter (`interpreter.mts`)**: 各コンポーネントを統合するエントリポイントです。
