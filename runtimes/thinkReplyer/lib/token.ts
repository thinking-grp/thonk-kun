import * as kuromoji from "kuromoji";
import * as database from "./database";


export async function tokenize(text: string): Promise<kuromoji.IpadicFeatures[]> {
  let result = new Promise<kuromoji.IpadicFeatures[]>((resolve) => {
    kuromoji
      .builder({
        dicPath: `${__dirname}/../node_modules/kuromoji/dict`,
      })
      .build((err, tokenizer) => {
        resolve(tokenizer.tokenize(text));
      });
  });
  return result;
}

export function getTokensByIdFromDatabase(id: string): database.Token {
  const dict: database.TokenDic = database.getTokenDic();
  let result: database.Token[] = [];

  dict.forEach((word) => {
    if (!word) return;
    if (typeof word !== "object") return;
    if (word.id !== id) return;

    result[result.length] = word;
  });

  return result[0];
}

export function getTokensByPosFromDatabase(pos: string): database.Token[] {
  const dict: database.TokenDic = database.getTokenDic();
  let result: database.Token[] = [];

  dict.forEach((word) => {
    if (!word) return;
    if (typeof word !== "object") return;
    if (word.pos !== pos) return;

    result[result.length] = word;
  });

  return result;
}

export function getTokenByPosFromDatabase(pos: string): database.Token {
  const dict: database.TokenDic = database.getTokenDic();
  let result: database.Token[] = [];

  dict.forEach((word) => {
    if (!word) return;
    if (typeof word !== "object") return;
    if (word.pos !== pos) return;

    result[result.length] = word;
  });

  console.log(pos, result.length)
  return result[Math.floor(Math.random() * ((result.length - 1) - 0) + 0)];
}

export function getToken(kuromojiToken: kuromoji.IpadicFeatures[], pos: string = "名詞"): kuromoji.IpadicFeatures[] {
  let result: kuromoji.IpadicFeatures[] = [];

  kuromojiToken.forEach((word) => {
    if (!word) return;
    if (typeof word !== "object") return;
    if (word.pos !== pos) return;

    result[result.length] = word;
  });

  return result;
}

export function getTokenByWord(tokens: kuromoji.IpadicFeatures[] | database.Token[], text: string): database.Token[] {
  if (!implementsTokens(tokens)) tokens = convertKuromojiToToken(tokens);

  let result: database.Token[] = [];

  tokens.forEach((word) => {
    if (!word) return;
    if (typeof word !== "object") return;
    if (word.text !== text) return;

    result[result.length] = word;
  });

  return result;
}

export function implementsTokens(arg: any): arg is database.Token[] {
  return arg !== null &&
    typeof arg === "object" &&
    typeof arg[0].text === "string"
}

export function implementsToken(arg: any): arg is database.Token {
  return arg !== null &&
    typeof arg === "object" &&
    typeof arg.text === "string"
}

export function excludeTokenWithPos(token: kuromoji.IpadicFeatures[] | database.Token[], pos: string = "名詞"): kuromoji.IpadicFeatures[] | database.Token[] {
  let result: kuromoji.IpadicFeatures[] | database.Token[] = [];

  token.forEach((word, i) => {
    if (!word) return;
    if (typeof word !== "object") return;
    if (word.pos !== pos) {
      result[result.length] = word;
    }

    result.splice(i, 1);
  });

  return result;
}

export function replaceTokensByPos(token: kuromoji.IpadicFeatures[] | database.Token[], replace: kuromoji.IpadicFeatures | database.Token | string, pos: string = "名詞"): kuromoji.IpadicFeatures[] | database.Token[] {
  if (implementsTokens(token)) {
    if (implementsToken(replace)) {
      if (typeof replace === "string") {
        token.forEach((word, i) => {
          if (!word) return;
          if (typeof word !== "object") return;
    
          if (word.pos === pos) {
            token[i].pos = replace;
          }
        });
      } else {
        token.forEach((word, i) => {
          if (!word) return;
          if (typeof word !== "object") return;

          if (word.pos === pos) {
            token[i] = replace;
          }
        });
      }
    }
  } else {
    if (implementsToken(replace)) throw new Error("aa");

    if (typeof replace === "string") {
      token.forEach((word, i) => {
        if (!word) return;
        if (typeof word !== "object") return;
  
        if (word.pos === pos) {
          token[i].pos = replace;
        }
      });
    } else {
      token.forEach((word, i) => {
        if (!word) return;
        if (typeof word !== "object") return;

        if (word.pos === pos) {
          token[i] = replace;
        }
      });
    }
  }

  return token;
}


export function hideTokensByPos(token: database.Token[], pos: string = "名詞"): database.Token[] {
  token.forEach((word, i) => {
    if (!word) return;
    if (typeof word !== "object") return;

    if (word.pos === pos) {
      token[i].id = "tkn-unknown";
    }
  });

  return token;
}

export function addTokenToDatabase(token: database.Token) {
  let dict: database.TokenDic = database.getTokenDic();

  dict[dict.length] = token;

  database.setTokenDic(dict);
}

export function addTokensToDatabase(tokens: database.Token[]) {
  let dict: database.TokenDic = database.getTokenDic();

  tokens.forEach((token) => {
    dict[dict.length] = token;
  });

  database.setTokenDic(dict);
}

export function convertKuromojiToToken(token: kuromoji.IpadicFeatures[] | database.Token[]): database.Token[] {
  if (implementsTokens(token)) return token;

  let result: database.Token[] = [];

  token.forEach((word) => {
    let databaseToken: database.Token = {
      id: `tkn-${database.generateId()}`,
      text: word.surface_form,
      pos: word.pos,
      pos_detail_1: word.pos_detail_1,
      pos_detail_2: word.pos_detail_2,
      pos_detail_3: word.pos_detail_3,
      conjugated_type: word.conjugated_type,
      conjugated_form: word.conjugated_form,
      basic_form: word.basic_form,
      group: [],
      raw_data: word
    };

    result[result.length] = databaseToken;
  });

  return result;
}

export function createTokenGroup(tokenGroup: database.TokenGroup) {
  let dict: database.TokenGroupDic = database.getTokenGroupDic();

  dict[dict.length] = tokenGroup;

  dict.forEach((group, index) => {
    if (!group) return;
    if (typeof group !== "object") return;

    if (group.id === tokenGroup.id) {
      dict = dict.splice(index, 1);
      dict[dict.length] = tokenGroup;
    }
  });

  database.setTokenGroupDic(dict);
}

export class TokenGroup {
  private tokenGroup: database.TokenGroup;

  constructor(tokenGroup: database.TokenGroup) {
    this.tokenGroup = tokenGroup;
  }

  addToken(token: database.Token) {
    this.tokenGroup.tokensId[this.tokenGroup.tokensId.length] = token.id;
  }

  removeToken(token: database.Token) {
    this.tokenGroup.tokensId.splice(this.tokenGroup.tokensId.indexOf(token.id), 1);
  }

  saveTokenGroup() {
    let dict = database.getTokenGroupDic();

    dict.forEach((group, index) => {
      if (!group) return;
      if (typeof group !== "object") return;

      if (group.id === this.tokenGroup.id) {
        dict = dict.splice(index, 1);
        dict[dict.length] = this.tokenGroup;
      }
    });

    database.setTokenGroupDic(dict);
  }
}

export function convertTokensToString(tokens: database.Token[]): string {
  let result = "";

  tokens.forEach((token) => {
    result += token.text;
  });

  return result;
}

export function generateUnkToken(base: database.Token = unkToken): database.Token {
  base.id = "tkn-unknown";
  return base;
}

export const unkToken: database.Token = {
  id: "tkn-unknown",
  text: "unknown",
  pos: "unknown",
  pos_detail_1: "*",
  pos_detail_2: "*",
  pos_detail_3: "*",
  conjugated_type: "*",
  conjugated_form: "*",
  basic_form: "*",
  group: [],
  raw_data: {},
  negaposi: 0
};