/** コード全体\
 * program = factor*
 */
export type Program = {
  type: "program";
  body: Factor[];
};

/** 式\
 * expression = orExpression
 */
export type Expression = OrExpression;

/** OR式\
 * orExpression = (orExpression "|" andExpression) | andExpression
 */
export type OrExpression =
  | {
      type: "orExpression";
      lhs: OrExpression;
      rhs: AndExpression;
    }
  | AndExpression;

/** AND式\
 * andExpression = (andExpression "&" relation) | relation
 */
export type AndExpression =
  | {
      type: "andExpression";
      lhs: AndExpression;
      rhs: Relation;
    }
  | Relation;

/** 関係\
 * relation = (additive ("==" | "<" | "<=" | ">" | ">=") additive) | additive
 */
export type Relation =
  | {
      type: "relation";
      lhs: Additive;
      op: "EQEQ" | "NOTEQ" | "LESS" | "LESSEQ" | "GREATER" | "GREATEREQ";
      rhs: Additive;
    }
  | Additive;

/** 多項式\
 * additive = (additive ("+" | "-") multiplicative) | multiplicative
 */
export type Additive =
  | {
      type: "additive";
      lhs: Additive;
      op: "ADD" | "SUB";
      rhs: Multiplicative;
    }
  | Multiplicative;

/** 項\
 * multiplicative = (multiplicative ("*" | "/" | "%") factor) | factor
 */
export type Multiplicative =
  | {
      type: "multiplicative";
      lhs: Multiplicative;
      op: "MUL" | "DIV" | "MOD";
      rhs: Factor;
    }
  | Factor;

/** 因子\
 * factor = "(" expression ")" | "{" program "}" | functionCall | assign | return | identifier | functionFactor | numberLiteral | stringLiteral
 */
export type Factor =
  | {
      type: "expressionFactor";
      body: Expression;
    }
  | Program
  | FunctionCall
  | Assign
  | Return
  | Identifier
  | FunctionFactor
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral;

/** 関数呼び出し\
 * functionCall = identifier "(" expression* ")"
 */
export type FunctionCall = {
  type: "functionCall";
  callee: Identifier;
  params: Expression[];
};

/** 代入\
 * assign = identifier "=" expression
 */
export type Assign = {
  type: "assign";
  variable: Identifier;
  value: Expression;
};

/** リターン\
 * return = "return" expression
 */
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
