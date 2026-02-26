#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { tokenize } from "./tokenizer.ts";
import { parse } from "./parser.ts";
import { evaluate } from "./evaluator.ts";

const input = process.argv[2];
const source = readFileSync(input, "utf-8");

const tokens = tokenize(source);
writeFileSync("tokens.json", JSON.stringify(tokens));

const ast = parse(tokens);
writeFileSync("ast.json", JSON.stringify(ast));

evaluate(ast);
