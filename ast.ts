/** コード全体 */
export type Program = {
  type: "program";
  body: Expression[];
};

/** 式 */
export type Expression =
  | Assign
  | If
  | BinaryExpression
  | UnaryExpression
  | FunctionCall
  | Factor;

/** if文 */
export type If = {
  type: "if";
  cond: Expression;
  consequent: Expression;
  alternate?: Expression;
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
  op: "NOT";
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
  | Identifier
  | FunctionFactor
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral;

/** 代入 */
export type Assign = {
  type: "assign";
  variable: Identifier;
  value: Expression;
};

/** リターン */
export type Return = {
  type: "return";
  value: Expression;
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
