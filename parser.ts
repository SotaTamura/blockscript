import type { Token } from "./tokenizer.ts";
import * as AST from "./ast.ts";

export function parse(tokens: Token[]): AST.Program {
  let i = 0;

  function peek() {
    return tokens[i];
  }

  function take<T extends Token["type"]>(type: T): Extract<Token, { type: T }> {
    const token = peek();
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    i++;
    return token as Extract<Token, { type: T }>;
  }

  /** コードの解析 */
  function parseProgram(): AST.Program {
    const body: AST.Factor[] = [];

    while (peek().type !== "END") {
      body.push(parseFactor());
    }

    return {
      type: "program",
      body,
    };
  }

  /** 式の解析 */
  function parseExpression(): AST.Expression {
    return parseOrExpression();
  }

  /** OR式の解析 */
  function parseOrExpression(): AST.OrExpression {
    let node: AST.OrExpression = parseAndExpression();

    while (peek().type === "OR") {
      take("OR");
      node = {
        type: "orExpression",
        lhs: node,
        rhs: parseAndExpression(),
      };
    }

    return node;
  }

  /** AND式の解析 */
  function parseAndExpression(): AST.AndExpression {
    let node: AST.AndExpression = parseRelation();

    while (peek().type === "AND") {
      take("AND");
      node = {
        type: "andExpression",
        lhs: node,
        rhs: parseRelation(),
      };
    }

    return node;
  }

  /** 関係の解析 */
  function parseRelation(): AST.Relation {
    let relation: AST.Relation = parseAdditive();
    if (
      ["EQEQ", "NOTEQ", "LESS", "LESSEQ", "GREATER", "GREATEREQ"].includes(
        peek().type,
      )
    ) {
      relation = {
        type: "relation",
        lhs: relation,
        op: take(peek().type).type as
          | "EQEQ"
          | "NOTEQ"
          | "LESS"
          | "LESSEQ"
          | "GREATER"
          | "GREATEREQ",
        rhs: parseAdditive(),
      };
    }
    return relation;
  }

  /** 多項式の解析 */
  function parseAdditive(): AST.Additive {
    let additive: AST.Additive = parseMultiplicative();

    while (["ADD", "SUB"].includes(peek().type)) {
      additive = {
        type: "additive",
        lhs: additive,
        op: take(peek().type).type as "ADD" | "SUB",
        rhs: parseMultiplicative(),
      };
    }

    return additive;
  }

  /** 項の解析 */
  function parseMultiplicative(): AST.Multiplicative {
    let multiplicative: AST.Multiplicative = parseFactor();

    while (["MUL", "DIV", "MOD"].includes(peek().type)) {
      multiplicative = {
        type: "multiplicative",
        lhs: multiplicative,
        op: take(peek().type).type as "MUL" | "DIV" | "MOD",
        rhs: parseFactor(),
      };
    }

    return multiplicative;
  }

  /** 因子の解析 */
  function parseFactor(): AST.Factor {
    switch (peek().type) {
      case "LPAREN":
        take("LPAREN");
        const expression = parseExpression();
        take("RPAREN");
        return {
          type: "expressionFactor",
          body: expression,
        };

      case "BEGIN":
        take("BEGIN");
        const program = parseProgram();
        take("END");
        return program;

      case "IDENTIFIER":
        const name = take("IDENTIFIER").value;
        switch (peek().type) {
          case "LPAREN":
            return parseFunctionCall(name);
          case "EQ":
            return parseAssign(name);
          default:
            return parseIdentifier(name);
        }

      case "RETURN":
        return parseReturn();

      case "FUNCTION":
        return parseFunctionFactor();

      case "NUMBER":
        return parseNumberLiteral();

      case "STRING":
        return parseStringLiteral();

      case "BOOLEAN":
        return parseBooleanLiteral();

      default:
        throw new Error("Unexpected factor token: " + JSON.stringify(peek()));
    }
  }

  /** 関数呼び出しの解析 */
  function parseFunctionCall(name: string): AST.FunctionCall {
    take("LPAREN");

    const params: AST.Expression[] = [];

    while (peek().type !== "RPAREN") {
      params.push(parseExpression());
      if (peek().type === "COMMA") take("COMMA");
    }

    take("RPAREN");

    return {
      type: "functionCall",
      callee: { type: "identifier", name },
      params,
    };
  }

  /** 代入の解析 */
  function parseAssign(name: string): AST.Assign {
    take("EQ");

    return {
      type: "assign",
      variable: { type: "identifier", name },
      value: parseExpression(),
    };
  }

  /** リターンの解析 */
  function parseReturn(): AST.Return {
    take("RETURN");

    return {
      type: "return",
      value: parseExpression(),
    };
  }

  /** 変数の解析 */
  function parseIdentifier(name: string): AST.Identifier {
    return {
      type: "identifier",
      name,
    };
  }

  /** 関数の解析 */
  function parseFunctionFactor(): AST.FunctionFactor {
    take("FUNCTION");
    take("LPAREN");

    const params: string[] = [];

    while (peek().type !== "RPAREN") {
      params.push(take("IDENTIFIER").value);
      if (peek().type === "COMMA") take("COMMA");
    }

    take("RPAREN");

    return {
      type: "functionFactor",
      params,
      body: parseExpression(),
    };
  }

  /** 数値の解析 */
  function parseNumberLiteral(): AST.NumberLiteral {
    return {
      type: "numberLiteral",
      value: take("NUMBER").value,
    };
  }

  /** 文字列の解析 */
  function parseStringLiteral(): AST.StringLiteral {
    return {
      type: "stringLiteral",
      value: take("STRING").value,
    };
  }

  /** ブール値の解析 */
  function parseBooleanLiteral(): AST.BooleanLiteral {
    return {
      type: "booleanLiteral",
      value: take("BOOLEAN").value,
    };
  }

  return parseProgram();
}
