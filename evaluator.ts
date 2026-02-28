import { isDeepStrictEqual } from "util";
import * as AST from "./ast.ts";

type Environment = {
  variables: Record<string, any>;
  parent?: Environment;
  thisValue?: any;
};

class ReturnSignal extends Error {
  value: any;
  constructor(value: any) {
    super();
    this.value = value;
  }
}

class BreakSignal extends Error {
  value: any;
  constructor(value: any) {
    super();
    this.value = value;
  }
}

class ContinueSignal extends Error {
  value: any;
  constructor(value: any) {
    super();
    this.value = value;
  }
}

const globalEnv: Environment = {
  variables: {
    print: console.log,
    range: (start: number, end: number) => {
      let r: number[] = [];
      for (let i = start; i <= end; i++) r.push(i);
      return r;
    },
    parseNumber: parseInt,
    parseString: (n: number) => n.toString(),
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

function getThis(env: Environment): any {
  if ("thisValue" in env) return env.thisValue;
  if (env.parent) return getThis(env.parent);
  return undefined;
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
          const value = evaluateExpression(node.value, env);
          switch (node.variable.type) {
            case "getItem":
              const list = evaluateExpression(node.variable.iterable, env);
              let index;
              if (typeof node.variable.index === "string")
                index = node.variable.index;
              else {
                const rawIndex = evaluateExpression(node.variable.index, env);
                if (typeof rawIndex === "number") index = rawIndex - 1;
                else index = rawIndex;
              }
              list[index] = value;
              return value;
            case "identifier":
              setVariable(env, node.variable.name, value);
              return value;
            default:
              throw new Error("Invalid assignment target");
          }
        case "if":
          return evaluateExpression(node.cond, env)
            ? evaluateExpression(node.consequent, env)
            : node.alternate
              ? evaluateExpression(node.alternate, env)
              : undefined;
        case "while":
          const whileRes = [];
          while (evaluateExpression(node.cond, env)) {
            try {
              const value = evaluateExpression(node.body, env);
              if (value !== undefined) whileRes.push(value);
            } catch (s) {
              if (s instanceof BreakSignal) {
                if (s.value !== undefined) whileRes.push(s.value);
                break;
              }
              if (s instanceof ContinueSignal) {
                if (s.value !== undefined) whileRes.push(s.value);
                continue;
              }
              throw s;
            }
          }
          return whileRes;
        case "for":
          const forRes = [];
          const list = evaluateExpression(node.list, env);
          for (const item of list) {
            const loopEnv: Environment = {
              variables: {},
              parent: env,
            };
            setVariable(loopEnv, node.iter, item);

            try {
              const value = evaluateExpression(node.body, loopEnv);
              if (value !== undefined) forRes.push(value);
            } catch (s) {
              if (s instanceof BreakSignal) {
                if (s.value !== undefined) forRes.push(s.value);
                break;
              }
              if (s instanceof ContinueSignal) {
                if (s.value !== undefined) forRes.push(s.value);
                continue;
              }
              throw s;
            }
          }
          return forRes;
        case "binaryExpression":
          return evaluateBinary(node, env);
        case "unaryExpression":
          return evaluateUnary(node, env);
        case "functionCall":
          const args = node.params.map((p) => evaluateExpression(p, env));
          return evaluateExpression(node.callee, env)(...args);
        case "getItem":
          const target = evaluateExpression(node.iterable, env);
          let index;
          if (typeof node.index === "string") index = node.index;
          else {
            const rawIndex = evaluateExpression(node.index, env);
            if (typeof rawIndex === "number") index = rawIndex - 1;
            else index = rawIndex;
          }
          const val = target[index];
          if (typeof val === "function") {
            return val.bind(target);
          }
          return val;
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
    const lType = typeof lhs;
    const rType = typeof rhs;

    switch (node.op) {
      case "ADD":
        if (Array.isArray(lhs) && Array.isArray(rhs)) return lhs.concat(rhs);
        if (lType === "object" && rType === "object") return { ...lhs, ...rhs };
        return lhs + rhs;
      case "SUB":
        if (lType === "string" && rType === "string")
          return lhs.replace(rhs, "");
        if (Array.isArray(lhs) && Array.isArray(rhs))
          return lhs.filter(
            (li) => !rhs.some((ri) => isDeepStrictEqual(li, ri)),
          );
        if (lType === "object" && rType === "object") {
          const r: Record<string, any> = {};
          for (const key in lhs) {
            r[key] = lhs[key];
          }
          for (const key in rhs) {
            if (isDeepStrictEqual(rhs[key], r[key])) {
              delete r[key];
            }
          }
          return r;
        }
        return lhs - rhs;
      case "MUL":
        if (lType === "string" && rhs >= 0 && Number.isInteger(rhs))
          return lhs.repeat(rhs);
        if (lhs >= 0 && Number.isInteger(lhs) && rType === "string")
          return rhs.repeat(lhs);
        if (Array.isArray(lhs) && rhs >= 0 && Number.isInteger(rhs)) {
          const r = [];
          for (let i = 0; i < rhs; i++) {
            r.push(...lhs);
          }
          return r;
        }
        if (lhs >= 0 && Number.isInteger(lhs) && Array.isArray(rhs)) {
          const r = [];
          for (let i = 0; i < lhs; i++) {
            r.push(...rhs);
          }
          return r;
        }
        return lhs * rhs;
      case "DIV":
        return lhs / rhs;
      case "MOD":
        return lhs % rhs;
      case "EQEQ":
        return isDeepStrictEqual(lhs, rhs);
      case "NOTEQ":
        return !isDeepStrictEqual(lhs, rhs);
      case "LESS":
        if (lType === "string" && rType === "string")
          return lhs !== rhs && rhs.includes(lhs);
        if (Array.isArray(lhs) && Array.isArray(rhs))
          return (
            !isDeepStrictEqual(lhs, rhs) &&
            lhs.every((li) => rhs.some((ri) => isDeepStrictEqual(li, ri)))
          );
        if (lType === "object" && rType === "object")
          return (
            !isDeepStrictEqual(lhs, rhs) &&
            Object.keys(lhs).every((key) =>
              isDeepStrictEqual(lhs[key], rhs[key]),
            )
          );
        return lhs < rhs;
      case "LESSEQ":
        if (lType === "string" && rType === "string") return rhs.includes(lhs);
        if (Array.isArray(lhs) && Array.isArray(rhs))
          return lhs.every((li) => rhs.some((ri) => isDeepStrictEqual(li, ri)));
        if (lType === "object" && rType === "object")
          return Object.keys(lhs).every((key) =>
            isDeepStrictEqual(lhs[key], rhs[key]),
          );
        return lhs <= rhs;
      case "GREATER":
        if (lType === "string" && rType === "string")
          return lhs !== rhs && lhs.includes(rhs);
        if (Array.isArray(lhs) && Array.isArray(rhs))
          return (
            !isDeepStrictEqual(lhs, rhs) &&
            rhs.every((ri) => lhs.some((li) => isDeepStrictEqual(li, ri)))
          );
        if (lType === "object" && rType === "object")
          return (
            !isDeepStrictEqual(lhs, rhs) &&
            Object.keys(rhs).every((key) =>
              isDeepStrictEqual(rhs[key], lhs[key]),
            )
          );
        return lhs > rhs;
      case "GREATEREQ":
        if (lType === "string" && rType === "string") return lhs.includes(rhs);
        if (Array.isArray(lhs) && Array.isArray(rhs))
          return rhs.every((ri) => lhs.some((li) => isDeepStrictEqual(li, ri)));
        if (lType === "object" && rType === "object")
          return Object.keys(rhs).every((key) =>
            isDeepStrictEqual(rhs[key], lhs[key]),
          );
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
      case "SUB":
        return -param;
      default:
        throw new Error(`Unknown unary operator: ${node.op}`);
    }
  }

  function evaluateFactor(node: AST.Factor, env: Environment): any {
    switch (node.type) {
      case "program":
        return evaluateProgram(node, { variables: {}, parent: env });
      case "return":
        throw new ReturnSignal(
          node.value ? evaluateExpression(node.value, env) : undefined,
        );
      case "break":
        throw new BreakSignal(
          node.value ? evaluateExpression(node.value, env) : undefined,
        );
      case "continue":
        throw new ContinueSignal(
          node.value ? evaluateExpression(node.value, env) : undefined,
        );
      case "functionFactor":
        return function (this: any, ...args: any[]) {
          const childEnv: Environment = {
            variables: {},
            parent: env,
            thisValue: this,
          };
          node.params.forEach((p, i) => (childEnv.variables[p] = args[i]));
          try {
            return evaluateExpression(node.body, childEnv);
          } catch (s) {
            if (s instanceof ReturnSignal) return s.value;
            throw s;
          }
        };
      case "this":
        return getThis(env);
      case "identifier":
        return getVariable(env, node.name);
      case "list":
        return node.items.map((i) => evaluateExpression(i, env));
      case "objectLiteral":
        const obj: Record<string, any> = {};
        for (const prop of node.props) {
          obj[prop.key] = evaluateExpression(prop.value, env);
        }
        return obj;
      case "numberLiteral":
        return node.value;
      case "stringLiteral":
        return node.value;
      case "booleanLiteral":
        return node.value;
      case "undefined":
        return undefined;
      default:
        throw new Error("Unexpected factor node: " + JSON.stringify(node));
    }
  }

  return evaluateProgram(node, globalEnv);
}
