import * as kuromoji from "kuromoji";
import * as tokenManager from "./token";
import * as database from "./database";

export const sentenceSplitSymbol: string[] = ["。", "！", "？", "!", "?", "."];

export function splitSentence(tokens: kuromoji.IpadicFeatures[] | database.Token[]): database.Token[][] {
  let convertedTokens: database.Token[] = tokenManager.convertKuromojiToToken(tokens);
  let result: database.Token[][] = [convertedTokens];

  for (let i = 0; i < convertedTokens.length; i++) {
    if (!convertedTokens[i + 1]) continue;

    let probabilityOfSeparation = 0;

    if (convertedTokens[i].pos_detail_1.includes("句点") && convertedTokens[i].text === "。") {
      probabilityOfSeparation += 1;
    }

    if (convertedTokens[i].pos === "感動詞") {
      probabilityOfSeparation += 0.6;
    }

    if (convertedTokens[i - 1]) {
      if (convertedTokens[i - 1].pos_detail_1.includes("終助詞")) {
        probabilityOfSeparation += 0.8;
      }

      if (convertedTokens[i].pos === "記号" && sentenceSplitSymbol.some(str => convertedTokens[i].text.includes(str)) && convertedTokens[i - 1].pos_detail_1.includes("終助詞")) {
        probabilityOfSeparation += 0.8;
      }

      if (convertedTokens[i].pos === "記号" && sentenceSplitSymbol.some(str => convertedTokens[i].text.includes(str)) && convertedTokens[i - 1].pos === "助動詞") {
        probabilityOfSeparation += 0.5;
      }
    }

    console.log("Token text:", convertedTokens[i].text);
    console.log("Token pos:", convertedTokens[i].pos);
    console.log("PoS (Probability of separation):", probabilityOfSeparation);

    if (probabilityOfSeparation >= 1) {
      result[result.length] = result[result.length - 1].slice(i + 1);
      result[result.length - 2] = result[result.length - 2].slice(0, i + 1);
    }
  }

  return result;
}

export function addSyntaxToDatabase(tokens: database.Syntax) {
  let dict: database.SyntaxDic = database.getSyntaxDic();

  dict[dict.length] = tokens;

  database.setSyntaxDic(dict);
}

export function generateFromRandomSyntax(): database.Token[] {
  const dict: database.SyntaxDic = database.getSyntaxDic();
  let result: database.Syntax;

  result = dict[Math.floor(Math.random() * ((dict.length - 1) - 0) + 0)];

  result.tokens.forEach((word, i) => {
    if (!word) return;
    if (typeof word !== "object") return;

    if (word.id === tokenManager.unkToken.id) {
      if (word.pos_detail_1.includes("接続")) return;
      if (word.pos_detail_1.includes("接尾")) return;
      
      const dict: database.TokenDic = database.getTokenDic();
    
      let eachResult: database.Token[] = [];

      dict.forEach((word) => {
        if (!word) return;
        if (typeof word !== "object") return;
        if (word.pos !== result.tokens[i].pos) return;
        if (word.conjugated_form !== result.tokens[i].conjugated_form) return;
        if (word.conjugated_type !== result.tokens[i].conjugated_type) return;
        if (word.pos_detail_1.includes("代名詞") && !result.tokens[i].pos_detail_1.includes("代名詞")) return;
    
        eachResult[eachResult.length] = word;
      });
    
      console.log(result.tokens[i].pos, result.tokens.length);
      
      result.tokens[i] = eachResult[Math.floor(Math.random() * ((eachResult.length - 1) - 0) + 0)];
    }
  });

  return result.tokens;
}

export function createSyntax(tokens: database.Token[]): database.Syntax {
  let result = tokenManager.hideTokensByPos(tokens, "名詞");

  if (!tokenManager.implementsTokens(result)) throw new Error("aa");

  for (let i = 0; i < result.length; i++) {
    if (!result[i + 1]) continue;

    let probabilityOfPenetrating = 0;

    if (result[i].pos_detail_1.includes("自立")) {
      probabilityOfPenetrating += 1;
    }

    if (result[i].pos_detail_1.includes("一般")) {
      probabilityOfPenetrating += 1;
    }
    
    if (probabilityOfPenetrating  >= 1) {
      result[i] = tokenManager.generateUnkToken(result[i]);
    }
  }

  return {
    id: `syn-${database.generateId()}`,
    tokens: result
  };
}