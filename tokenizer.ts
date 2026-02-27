export type Token =
  | { type: "IDENTIFIER"; value: string }
  | { type: "NUMBER"; value: number }
  | { type: "STRING"; value: string }
  | { type: "BOOLEAN"; value: boolean }
  | { type: "LPAREN" }
  | { type: "RPAREN" }
  | { type: "LBRACKET" }
  | { type: "RBRACKET" }
  | { type: "BEGIN" }
  | { type: "END" }
  | { type: "COMMA" }
  | { type: "COLON" }
  | { type: "DOT" }
  | { type: "THIS" }
  | { type: "ADD" }
  | { type: "SUB" }
  | { type: "MUL" }
  | { type: "DIV" }
  | { type: "MOD" }
  | { type: "EQEQ" }
  | { type: "NOTEQ" }
  | { type: "LESS" }
  | { type: "LESSEQ" }
  | { type: "GREATER" }
  | { type: "GREATEREQ" }
  | { type: "AND" }
  | { type: "OR" }
  | { type: "NOT" }
  | { type: "EQ" }
  | { type: "RETURN" }
  | { type: "FUNCTION" }
  | { type: "IF" }
  | { type: "ELSE" }
  | { type: "WHILE" }
  | { type: "FOR" }
  | { type: "IN" }
  | { type: "BREAK" }
  | { type: "CONTINUE" }
  | { type: "SEMICOLON" }
  | { type: "EOF" };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    switch (char) {
      case " ":
      case "\t":
      case "\n":
      case "\r":
        i++;
        continue;

      case ";":
        tokens.push({ type: "SEMICOLON" });
        i++;
        continue;

      case ",":
        tokens.push({ type: "COMMA" });
        i++;
        continue;

      case "(":
        tokens.push({ type: "LPAREN" });
        i++;
        continue;

      case ")":
        tokens.push({ type: "RPAREN" });
        i++;
        continue;

      case "[":
        tokens.push({ type: "LBRACKET" });
        i++;
        continue;

      case "]":
        tokens.push({ type: "RBRACKET" });
        i++;
        continue;

      case "{":
        tokens.push({ type: "BEGIN" });
        i++;
        continue;

      case "}":
        tokens.push({ type: "END" });
        i++;
        continue;

      case ":":
        tokens.push({ type: "COLON" });
        i++;
        continue;

      case ".":
        tokens.push({ type: "DOT" });
        i++;
        continue;

      case "+":
        tokens.push({ type: "ADD" });
        i++;
        continue;

      case "-":
        tokens.push({ type: "SUB" });
        i++;
        continue;

      case "*":
        tokens.push({ type: "MUL" });
        i++;
        continue;

      case "/":
        tokens.push({ type: "DIV" });
        i++;
        continue;

      case "%":
        tokens.push({ type: "MOD" });
        i++;
        continue;

      case "&":
        tokens.push({ type: "AND" });
        i++;
        continue;

      case "|":
        tokens.push({ type: "OR" });
        i++;
        continue;

      case "=":
        if (input[i + 1] === "=") {
          tokens.push({ type: "EQEQ" });
          i += 2;
        } else {
          tokens.push({ type: "EQ" });
          i++;
        }
        continue;

      case "!":
        if (input[i + 1] === "=") {
          tokens.push({ type: "NOTEQ" });
          i += 2;
        } else {
          tokens.push({ type: "NOT" });
          i++;
        }
        continue;

      case "<":
        if (input[i + 1] === "=") {
          tokens.push({ type: "LESSEQ" });
          i += 2;
        } else {
          tokens.push({ type: "LESS" });
          i++;
        }
        continue;

      case ">":
        if (input[i + 1] === "=") {
          tokens.push({ type: "GREATEREQ" });
          i += 2;
        } else {
          tokens.push({ type: "GREATER" });
          i++;
        }
        continue;

      case "#":
        i++;
        while (i < input.length && input[i] !== "#") {
          i++;
        }
        i++;
        continue;

      case '"':
        let value = "";
        i++; // 開始の " をスキップ
        while (i < input.length && input[i] !== '"') {
          value += input[i++];
        }
        i++; // 終了の " をスキップ
        tokens.push({ type: "STRING", value });
        continue;

      default:
        // 数値
        if (/[0-9]/.test(char)) {
          let value = "";
          while (i < input.length && /[0-9]/.test(input[i])) {
            value += input[i++];
          }
          tokens.push({ type: "NUMBER", value: Number(value) });
          continue;
        }

        // 変数・識別子
        if (/[a-zA-Z_]/.test(char)) {
          let value = "";
          while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
            value += input[i++];
          }
          switch (value) {
            case "true":
              tokens.push({ type: "BOOLEAN", value: true });
              continue;
            case "false":
              tokens.push({ type: "BOOLEAN", value: false });
              continue;

            case "return":
              tokens.push({ type: "RETURN" });
              continue;

            case "function":
              tokens.push({ type: "FUNCTION" });
              continue;

            case "if":
              tokens.push({ type: "IF" });
              continue;

            case "else":
              tokens.push({ type: "ELSE" });
              continue;

            case "while":
              tokens.push({ type: "WHILE" });
              continue;

            case "for":
              tokens.push({ type: "FOR" });
              continue;

            case "in":
              tokens.push({ type: "IN" });
              continue;

            case "continue":
              tokens.push({ type: "CONTINUE" });
              continue;

            case "break":
              tokens.push({ type: "BREAK" });
              continue;

            case "this":
              tokens.push({ type: "THIS" });
              continue;

            default:
              tokens.push({ type: "IDENTIFIER", value });
              continue;
          }
        }

        throw new Error("Unexpected character: " + char);
    }
  }

  tokens.push({ type: "EOF" });
  return tokens;
}
