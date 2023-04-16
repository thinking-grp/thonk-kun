import * as fs from "fs";

export function getTokenDic () : TokenDic {
  if (!fs.existsSync(`${__dirname}/../assets/token_dictionary.db`)) {
    fs.writeFileSync(`${__dirname}/../assets/token_dictionary.db`, JSON.stringify([]));
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/token_dictionary.db`, { encoding: "utf-8" })
  );
}

export type Token = {
  id: string;
  text: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  group: string[];
  raw_data: any;
  negaposi?: number;
};

export type TokenDic = Token[];

export function getSyntaxDic () : SyntaxDic {
  if (!fs.existsSync(`${__dirname}/../assets/syntax_dictionary.db`)) {
    fs.writeFileSync(`${__dirname}/../assets/syntax_dictionary.db`, JSON.stringify([]));
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/syntax_dictionary.db`, { encoding: "utf-8" })
  );
}

export type Syntax = {
  id: string;
  tokens: Token[];
};

export type SyntaxDic = Syntax[];

export function getTokenGroupDic () : TokenGroupDic {
  if (!fs.existsSync(`${__dirname}/../assets/token_group_dictionary.db`)) {
    fs.writeFileSync(`${__dirname}/../assets/token_group_dictionary.db`, JSON.stringify([]));
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/token_group_dictionary.db`, { encoding: "utf-8" })
  );
}

export type TokenGroup = {
  id: string;
  tokensId: string[];
  negaposi?: number
};

export type TokenGroupDic = TokenGroup[];


export function setTokenDic (object: TokenDic) {
  fs.writeFileSync(`${__dirname}/../assets/token_dictionary.db`, JSON.stringify(object, null , "\t"));
}

export function setSyntaxDic (object: SyntaxDic) {
  fs.writeFileSync(`${__dirname}/../assets/syntax_dictionary.db`, JSON.stringify(object, null , "\t"));
}

export function setTokenGroupDic (object: TokenGroupDic) {
  fs.writeFileSync(`${__dirname}/../assets/token_group_dictionary.db`, JSON.stringify(object, null , "\t"));
}

export function generateId(digit: number = 12): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < digit; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters.charAt(randomIndex);
  }
  return id;
}