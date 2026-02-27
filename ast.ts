/** コード全体 */
export type Program = {
  type: "program";
  body: Expression[];
};

/** 式 */
export type Expression =
  | Assign
  | If
  | While
  | For
  | BinaryExpression
  | UnaryExpression
  | FunctionCall
  | GetItem
  | Factor;

/** if文 */
export type If = {
  type: "if";
  cond: Expression;
  consequent: Expression;
  alternate?: Expression;
};

/** while文 */
export type While = {
  type: "while";
  cond: Expression;
  body: Expression;
};

/** for文 */
export type For = {
  type: "for";
  iter: string;
  list: Expression;
  body: Expression;
};

/** 代入 */
export type Assign = {
  type: "assign";
  variable: Identifier | GetItem;
  value: Expression;
};

/** 二項式 */
export type BinaryExpression = {
  type: "binaryExpression";
  op:
    | "ADD"
    | "SUB"
    | "MUL"
    | "DIV"
    | "MOD"
    | "EQEQ"
    | "NOTEQ"
    | "LESS"
    | "LESSEQ"
    | "GREATER"
    | "GREATEREQ"
    | "AND"
    | "OR";
  lhs: Expression;
  rhs: Expression;
};

/** 単項式 */
export type UnaryExpression = {
  type: "unaryExpression";
  op: "NOT" | "SUB";
  param: Expression;
};

/** 関数呼び出し */
export type FunctionCall = {
  type: "functionCall";
  callee: Expression;
  params: Expression[];
};

/** 因子 */
export type Factor =
  | { type: "expressionFactor"; body: Expression }
  | Program
  | Return
  | Break
  | Continue
  | Identifier
  | List
  | FunctionFactor
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral;

/** 配列 */
export type List = {
  type: "list";
  items: Expression[];
};

/** 配列の要素取得 */
export type GetItem = {
  type: "getItem";
  list: Expression;
  index: Expression;
};

/** リターン */
export type Return = {
  type: "return";
  value?: Expression;
};

/** ブレーク */
export type Break = {
  type: "break";
  value?: Expression;
};

/** 継続 */
export type Continue = {
  type: "continue";
  value?: Expression;
};

/** 変数名・関数名 */
export type Identifier = {
  type: "identifier";
  name: string;
};

/** 関数 */
export type FunctionFactor = {
  type: "functionFactor";
  params: string[];
  body: Expression;
};

/** 数値リテラル */
export type NumberLiteral = {
  type: "numberLiteral";
  value: number;
};

/** 文字列リテラル */
export type StringLiteral = {
  type: "stringLiteral";
  value: string;
};

/** ブール値リテラル */
export type BooleanLiteral = {
  type: "booleanLiteral";
  value: boolean;
};
