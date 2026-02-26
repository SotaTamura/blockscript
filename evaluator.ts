import * as AST from "./ast.ts";

type Environment = {
  variables: Record<string, any>;
  parent?: Environment;
};

class ReturnSignal extends Error {
  value: any;
  constructor(value: any) {
    super();
    this.value = value;
  }
}

const global: Environment = {
  variables: {
    print: console.log,
  },
};

/** 変数の取得 */
function getVariable(env: Environment, name: string): any {
  if (name in env.variables) {
    return env.variables[name];
  }
  if (env.parent) {
    return getVariable(env.parent, name);
  }
  throw new Error(`Undefined variable: ${name}`);
}

/** 変数の設定 */
function setVariable(env: Environment, name: string, value: any): any {
  let current: Environment | undefined = env;
  while (current) {
    if (name in current.variables) {
      current.variables[name] = value;
      return;
    }
    current = current.parent;
  }
  env.variables[name] = value;
  return value;
}

export function evaluate(node: AST.Program): any {
  /** コードの評価 */
  function evaluateProgram(node: AST.Program, env: Environment): any {
    node.body.forEach((f) => evaluateFactor(f, env));
  }

  /** 代入の評価 */
  function evaluateAssign(node: AST.Assign, env: Environment): any {
    let value;
    try {
      value = evaluateExpression(node.value, env);
    } catch (signal) {
      if (signal instanceof ReturnSignal) value = signal.value;
      else throw signal;
    }
    return setVariable(env, node.variable.name, value);
  }

  /** 関数呼び出しの評価 */
  function evaluateFunctionCall(node: AST.FunctionCall, env: Environment): any {
    return getVariable(
      env,
      node.callee.name,
    )(...node.params.map((param) => evaluateExpression(param, env)));
  }

  /** 関数の評価 */
  function evaluateFunctionFactor(
    node: AST.FunctionFactor,
    env: Environment,
  ): any {
    return (...params: any[]) => {
      const childEnv: Environment = {
        variables: {},
        parent: env,
      };
      node.params.forEach((param, i) => {
        childEnv.variables[param] = params[i];
      });
      try {
        return evaluateExpression(node.body, childEnv);
      } catch (signal) {
        if (signal instanceof ReturnSignal) return signal.value;
        throw signal;
      }
    };
  }

  /** リターンの評価 */
  function evaluateReturn(node: AST.Return, env: Environment): any {
    throw new ReturnSignal(
      node.value ? evaluateExpression(node.value, env) : undefined,
    );
  }

  /** 式の評価 */
  function evaluateExpression(node: AST.Expression, env: Environment): any {
    return evaluateOrExpression(node, env);
  }

  /** OR式の評価 */
  function evaluateOrExpression(node: AST.OrExpression, env: Environment): any {
    switch (node.type) {
      case "orExpression":
        return (
          evaluateOrExpression(node.lhs, env) ||
          evaluateAndExpression(node.rhs, env)
        );
      default:
        return evaluateAndExpression(node, env);
    }
  }

  /** AND式の評価 */
  function evaluateAndExpression(
    node: AST.AndExpression,
    env: Environment,
  ): any {
    switch (node.type) {
      case "andExpression":
        return (
          evaluateAndExpression(node.lhs, env) &&
          evaluateRelation(node.rhs, env)
        );
      default:
        return evaluateRelation(node, env);
    }
  }

  /** 関係の評価 */
  function evaluateRelation(node: AST.Relation, env: Environment): any {
    switch (node.type) {
      case "relation":
        switch (node.op) {
          case "EQEQ":
            return (
              evaluateAdditive(node.lhs, env) ===
              evaluateAdditive(node.rhs, env)
            );
          case "NOTEQ":
            return (
              evaluateAdditive(node.lhs, env) !==
              evaluateAdditive(node.rhs, env)
            );
          case "LESS":
            return (
              evaluateAdditive(node.lhs, env) < evaluateAdditive(node.rhs, env)
            );
          case "LESSEQ":
            return (
              evaluateAdditive(node.lhs, env) <= evaluateAdditive(node.rhs, env)
            );
          case "GREATER":
            return (
              evaluateAdditive(node.lhs, env) > evaluateAdditive(node.rhs, env)
            );
          case "GREATEREQ":
            return (
              evaluateAdditive(node.lhs, env) >= evaluateAdditive(node.rhs, env)
            );
        }
      default:
        return evaluateAdditive(node, env);
    }
  }

  /** 多項式の評価 */
  function evaluateAdditive(node: AST.Additive, env: Environment): any {
    switch (node.type) {
      case "additive":
        switch (node.op) {
          case "ADD":
            return (
              evaluateAdditive(node.lhs, env) +
              evaluateMultiplicative(node.rhs, env)
            );
          case "SUB":
            return (
              evaluateAdditive(node.lhs, env) -
              evaluateMultiplicative(node.rhs, env)
            );
          default:
            throw new Error(
              "Unexpected expression node: " + JSON.stringify(node),
            );
        }
      default:
        return evaluateMultiplicative(node, env);
    }
  }

  /** 項の評価 */
  function evaluateMultiplicative(
    node: AST.Multiplicative,
    env: Environment,
  ): any {
    switch (node.type) {
      case "multiplicative":
        switch (node.op) {
          case "MUL":
            return (
              evaluateMultiplicative(node.lhs, env) *
              evaluateFactor(node.rhs, env)
            );
          case "DIV":
            return (
              evaluateMultiplicative(node.lhs, env) /
              evaluateFactor(node.rhs, env)
            );
          case "MOD":
            return (
              evaluateMultiplicative(node.lhs, env) %
              evaluateFactor(node.rhs, env)
            );
          default:
            throw new Error("Unexpected term node: " + JSON.stringify(node));
        }
      default:
        return evaluateFactor(node, env);
    }
  }

  /** 因子の評価 */
  function evaluateFactor(node: AST.Factor, env: Environment): any {
    switch (node.type) {
      case "expressionFactor":
        return evaluateExpression(node.body, env);
      case "program":
        return evaluateProgram(node, { variables: {}, parent: env });
      case "functionCall":
        return evaluateFunctionCall(node, env);
      case "assign":
        return evaluateAssign(node, env);
      case "return":
        return evaluateReturn(node, env);
      case "functionFactor":
        return evaluateFunctionFactor(node, env);
      case "identifier":
        return evaluateIdentifier(node, env);
      case "numberLiteral":
        return evaluateNumberLiteral(node);
      case "stringLiteral":
        return evaluateStringLiteral(node);
      case "booleanLiteral":
        return evaluateBooleanLiteral(node);
      default:
        throw new Error("Unexpected factor node: " + JSON.stringify(node));
    }
  }

  /** 変数の評価 */
  function evaluateIdentifier(node: AST.Identifier, env: Environment): any {
    return getVariable(env, node.name);
  }

  /** 数値の評価 */
  function evaluateNumberLiteral(node: AST.NumberLiteral): number {
    return node.value;
  }

  /** 文字列の評価 */
  function evaluateStringLiteral(node: AST.StringLiteral): string {
    return node.value;
  }

  /** ブール値の評価 */
  function evaluateBooleanLiteral(node: AST.BooleanLiteral): boolean {
    return node.value;
  }

  return evaluateProgram(node, global);
}
