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

const globalEnv: Environment = {
  variables: {
    print: console.log,
  },
};

function getVariable(env: Environment, name: string): any {
  if (name in env.variables) return env.variables[name];
  if (env.parent) return getVariable(env.parent, name);
  throw new Error(`Undefined variable: ${name}`);
}

function setVariable(env: Environment, name: string, value: any): any {
  let current: Environment | undefined = env;
  while (current) {
    if (name in current.variables) {
      current.variables[name] = value;
      return value;
    }
    current = current.parent;
  }
  env.variables[name] = value;
  return value;
}

export function evaluate(node: AST.Program): any {
  function evaluateProgram(node: AST.Program, env: Environment): any {
    let res: any;
    for (const e of node.body) {
      res = evaluateExpression(e, env);
    }
    return res;
  }

  function evaluateExpression(node: AST.Expression, env: Environment): any {
    if ("type" in node) {
      switch (node.type) {
        case "assign":
          return setVariable(
            env,
            node.variable.name,
            evaluateExpression(node.value, env),
          );
        case "if":
          return evaluateExpression(node.cond, env)
            ? evaluateExpression(node.consequent, env)
            : node.alternate
              ? evaluateExpression(node.alternate, env)
              : undefined;
        case "binaryExpression":
          return evaluateBinary(node, env);
        case "unaryExpression":
          return evaluateUnary(node, env);
        case "functionCall":
          return evaluateExpression(
            node.callee,
            env,
          )(...node.params.map((p) => evaluateExpression(p, env)));
        default:
          return evaluateFactor(node, env);
      }
    }
    return evaluateFactor(node as AST.Factor, env);
  }

  function evaluateBinary(node: AST.BinaryExpression, env: Environment): any {
    if (node.op === "OR")
      return (
        evaluateExpression(node.lhs, env) || evaluateExpression(node.rhs, env)
      );
    if (node.op === "AND")
      return (
        evaluateExpression(node.lhs, env) && evaluateExpression(node.rhs, env)
      );

    const lhs = evaluateExpression(node.lhs, env);
    const rhs = evaluateExpression(node.rhs, env);

    switch (node.op) {
      case "ADD":
        return lhs + rhs;
      case "SUB":
        return lhs - rhs;
      case "MUL":
        return lhs * rhs;
      case "DIV":
        return lhs / rhs;
      case "MOD":
        return lhs % rhs;
      case "EQEQ":
        return lhs === rhs;
      case "NOTEQ":
        return lhs !== rhs;
      case "LESS":
        return lhs < rhs;
      case "LESSEQ":
        return lhs <= rhs;
      case "GREATER":
        return lhs > rhs;
      case "GREATEREQ":
        return lhs >= rhs;
      default:
        throw new Error(`Unknown binary operator: ${node.op}`);
    }
  }

  function evaluateUnary(node: AST.UnaryExpression, env: Environment): any {
    const param = evaluateExpression(node.param, env);
    switch (node.op) {
      case "NOT":
        return !param;
      default:
        throw new Error(`Unknown unary operator: ${node.op}`);
    }
  }

  function evaluateFactor(node: AST.Factor, env: Environment): any {
    switch (node.type) {
      case "expressionFactor":
        return evaluateExpression(node.body, env);
      case "program":
        return evaluateProgram(node, { variables: {}, parent: env });
      case "return":
        throw new ReturnSignal(evaluateExpression(node.value, env));
      case "functionFactor":
        return (...args: any[]) => {
          const childEnv: Environment = { variables: {}, parent: env };
          node.params.forEach((p, i) => (childEnv.variables[p] = args[i]));
          try {
            return evaluateExpression(node.body, childEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) return e.value;
            throw e;
          }
        };
      case "identifier":
        return getVariable(env, node.name);
      case "numberLiteral":
        return node.value;
      case "stringLiteral":
        return node.value;
      case "booleanLiteral":
        return node.value;
      default:
        throw new Error("Unexpected factor node: " + JSON.stringify(node));
    }
  }

  return evaluateProgram(node, globalEnv);
}
