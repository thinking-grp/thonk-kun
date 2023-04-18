import * as database from "./database";

export function createTokenGroup(tokensId: string[], negaposi: number): database.TokenGroup {
  return {
    id: `tng-${database.generateId()}`,
    tokensId,
    negaposi
  };
}

export function addTokenGroupToDatabase(token: database.TokenGroup) {
  let dict: database.TokenGroupDic = database.getTokenGroupDic();

  dict[dict.length] = token;

  database.setTokenGroupDic(dict);
}