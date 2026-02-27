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

  function parseProgram(): AST.Program {
    const body: AST.Expression[] = [];
    while (peek().type !== "END") {
      body.push(parseExpression());
      if (peek().type === "SEMICOLON") {
        take("SEMICOLON");
      }
    }
    return { type: "program", body };
  }

  function parseExpression(): AST.Expression {
    switch (peek().type) {
      case "IF":
        return parseIf();
      case "WHILE":
        return parseWhile();
      case "FOR":
        return parseFor();
      default:
        return parseAssign();
    }
  }

  function parseIf(): AST.If {
    take("IF");
    take("LPAREN");
    const cond = parseExpression();
    take("RPAREN");
    const consequent = parseExpression();
    let alternate;
    if (peek().type === "ELSE") {
      take("ELSE");
      alternate = parseExpression();
    }
    return {
      type: "if",
      cond,
      consequent,
      alternate,
    };
  }

  function parseWhile(): AST.While {
    take("WHILE");
    take("LPAREN");
    const cond = parseExpression();
    take("RPAREN");
    return {
      type: "while",
      cond,
      body: parseExpression(),
    };
  }

  function parseFor(): AST.For {
    take("FOR");
    take("LPAREN");
    const iter = take("IDENTIFIER").value;
    take("IN");
    const list = parseExpression();
    take("RPAREN");

    return {
      type: "for",
      iter,
      list,
      body: parseExpression(),
    };
  }

  function parseAssign(): AST.Expression {
    const node = parseOr();
    if (peek().type === "EQ") {
      take("EQ");
      if (node.type !== "identifier" && node.type !== "getItem") {
        throw new Error("Invalid left-hand side in assignment");
      }
      return {
        type: "assign",
        variable: node,
        value: parseExpression(),
      };
    }
    return node;
  }

  function parseOr(): AST.Expression {
    let node = parseAnd();
    while (peek().type === "OR") {
      take("OR");
      node = {
        type: "binaryExpression",
        op: "OR",
        lhs: node,
        rhs: parseAnd(),
      };
    }
    return node;
  }

  function parseAnd(): AST.Expression {
    let node = parseRelation();
    while (peek().type === "AND") {
      take("AND");
      node = {
        type: "binaryExpression",
        op: "AND",
        lhs: node,
        rhs: parseRelation(),
      };
    }
    return node;
  }

  function parseRelation(): AST.Expression {
    let node = parseAdditive();
    if (
      ["EQEQ", "NOTEQ", "LESS", "LESSEQ", "GREATER", "GREATEREQ"].includes(
        peek().type,
      )
    ) {
      node = {
        type: "binaryExpression",
        op: take(peek().type).type as
          | "EQEQ"
          | "NOTEQ"
          | "LESS"
          | "LESSEQ"
          | "GREATER"
          | "GREATEREQ",
        lhs: node,
        rhs: parseAdditive(),
      };
    }
    return node;
  }

  function parseAdditive(): AST.Expression {
    let node = parseMultiplicative();
    while (["ADD", "SUB"].includes(peek().type)) {
      node = {
        type: "binaryExpression",
        op: take(peek().type).type as "ADD" | "SUB",
        lhs: node,
        rhs: parseMultiplicative(),
      };
    }
    return node;
  }

  function parseMultiplicative(): AST.Expression {
    let node = parseUnary();
    while (["MUL", "DIV", "MOD"].includes(peek().type)) {
      node = {
        type: "binaryExpression",
        op: take(peek().type).type as "MUL" | "DIV" | "MOD",
        lhs: node,
        rhs: parseUnary(),
      };
    }
    return node;
  }

  function parseUnary(): AST.Expression {
    const type = peek().type;
    if (["NOT", "SUB"].includes(type)) {
      take(type as "NOT" | "SUB");
      return {
        type: "unaryExpression",
        op: type as "NOT" | "SUB",
        param: parseUnary(),
      };
    }
    return parsePostfix();
  }

  function parsePostfix(): AST.Expression {
    let node = parseFactor();

    while (peek().type === "LPAREN" || peek().type === "LBRACKET") {
      if (peek().type === "LPAREN") {
        node = parseCall(node);
      } else {
        node = parseGetItem(node);
      }
    }

    return node;
  }

  function parseCall(callee: AST.Expression): AST.FunctionCall {
    take("LPAREN");
    const params: AST.Expression[] = [];
    while (peek().type !== "RPAREN") {
      params.push(parseExpression());
      if (peek().type === "COMMA") take("COMMA");
    }
    take("RPAREN");
    return {
      type: "functionCall",
      callee,
      params,
    };
  }

  function parseGetItem(list: AST.Expression): AST.GetItem {
    take("LBRACKET");
    const index = parseExpression();
    take("RBRACKET");
    return {
      type: "getItem",
      list,
      index,
    };
  }

  function parseFactor(): AST.Expression {
    switch (peek().type) {
      case "LPAREN":
        take("LPAREN");
        const expression = parseExpression();
        take("RPAREN");
        return { type: "expressionFactor", body: expression };

      case "LBRACKET":
        take("LBRACKET");
        const items: AST.Expression[] = [];
        while (peek().type !== "RBRACKET") {
          items.push(parseExpression());
          if (peek().type === "COMMA") take("COMMA");
        }
        take("RBRACKET");
        return { type: "list", items };

      case "BEGIN":
        take("BEGIN");
        const program = parseProgram();
        take("END");
        return program;

      case "LBRACKET":
        return parseList();

      case "IDENTIFIER":
        const name = take("IDENTIFIER").value;
        return { type: "identifier", name };

      case "RETURN":
        take("RETURN");
        if (["SEMICOLON", "END", "RPAREN", "COMMA"].includes(peek().type)) {
          return { type: "return" };
        }
        return { type: "return", value: parseExpression() };

      case "BREAK":
        take("BREAK");
        if (["SEMICOLON", "END", "RPAREN", "COMMA"].includes(peek().type)) {
          return { type: "break" };
        }
        return { type: "break", value: parseExpression() };

      case "CONTINUE":
        take("CONTINUE");
        if (["SEMICOLON", "END", "RPAREN", "COMMA"].includes(peek().type)) {
          return { type: "continue" };
        }
        return { type: "continue", value: parseExpression() };

      case "FUNCTION":
        return parseFunctionFactor();

      case "NUMBER":
        return { type: "numberLiteral", value: take("NUMBER").value };

      case "STRING":
        return { type: "stringLiteral", value: take("STRING").value };

      case "BOOLEAN":
        return { type: "booleanLiteral", value: take("BOOLEAN").value };

      default:
        throw new Error("Unexpected factor token: " + JSON.stringify(peek()));
    }
  }

  function parseList(): AST.List {
    take("LBRACKET");
    const items: AST.Expression[] = [];
    while (peek().type !== "RBRACKET") {
      items.push(parseExpression());
      if (peek().type === "COMMA") take("COMMA");
    }
    take("RBRACKET");
    return { type: "list", items };
  }

  function parseFunctionFactor(): AST.FunctionFactor {
    take("FUNCTION");
    take("LPAREN");
    const params: string[] = [];
    while (peek().type !== "RPAREN") {
      params.push(take("IDENTIFIER").value);
      if (peek().type === "COMMA") take("COMMA");
    }
    take("RPAREN");
    return { type: "functionFactor", params, body: parseExpression() };
  }

  return parseProgram();
}
