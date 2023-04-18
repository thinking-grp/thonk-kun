import * as kuromoji from "kuromoji";
import * as tokenManager from "./token";
import * as database from "./database";
import * as knowledgeManager from "./knowledge";

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

export function isQuestion(syntax: database.Syntax): boolean {
  let result: number = 0;
  syntax.tokens.forEach((token, i) => {
    if (token.pos_detail_1.includes("終助詞") && syntax.tokens[i + 1]) {
      if (syntax.tokens[i + 1].pos !== "名詞" || syntax.tokens[i + 1].pos !== "形容詞") {
        result += 0.2;
      }
    }

    if (token.text === "?" || token.text === "？") {
      if (syntax.tokens[i - 1]) {
        result += 1;
      }
    }
  });

  return result > 0;
}

export function createSyntaxMean(syntax: database.Syntax): database.SyntaxMean[] {
  let knowledge = knowledgeManager.createTwoTokensKnowledge(syntax);
  let result: database.Syntax = { ...syntax };

  result.tokens = [];

  if (!result.mean) {
    result.mean = [];

    result.mean[0] = {
      is: [],
      isQuestion: isQuestion(syntax)
    };
  }

  if (knowledge.can) {
    result.mean[0].can = knowledge.can;
  }

  if (knowledge.is) {
    result.mean[0].is = knowledge.is;
  }

  const type = knowledgeManager.whichOfTwoTokensKnowledgeTypes(syntax);

  if (!result.mean[0].question) {
    result.mean[0].question = {
      type: "confirm"
    };
  }
  if (type === "x-is-y") {
    result.mean[0].question.type = type;
  } else if (type === "x-isnt-y") {
    result.mean[0].question.type = type;
  } else if (type === "x-can-y") {
    result.mean[0].question.type = type;
  }

  return result.mean;
}

export function addSyntaxToDatabase(tokens: database.Syntax) {
  let dict: database.SyntaxDic = database.getSyntaxDic();

  dict[dict.length] = tokens;

  database.setSyntaxDic(dict);
}

export function isPositive(tokens: database.Token[]): boolean {
  let negativeOrPositive: number = 0;

  tokens.forEach((token, i) => {
    if (token.text === "はい" && token.pos === "感動詞") {
      negativeOrPositive += 1;
    }

    if (token.text === "いいえ" && token.pos === "感動詞") {
      negativeOrPositive -= 1;
    }

    if (token.text === "うん" && token.pos === "感動詞") {
      negativeOrPositive += 1;
    }

    if (token.basic_form === "違う" && token.pos === "動詞") {
      negativeOrPositive -= 1;
    }

    if (token.basic_form === "そう" && token.pos === "副詞" && token.pos_detail_1 === "助詞類接続") {
      negativeOrPositive += 1;
    }
  });
  return negativeOrPositive >= 1;
}

export function generateFromRandomSyntax(): database.Token[] {
  const dict: database.SyntaxDic = database.getSyntaxDic();
  let result: database.Syntax;

  result = dict[Math.floor(Math.random() * ((dict.length - 1) - 0) + 0)];

  result.tokens.forEach((word, i) => {
    if (!word) return;
    if (typeof word !== "object") return;

    if (word.pos_detail_3.includes("置換可能")) {
      if (word.pos_detail_1.includes("接続")) return;

      const dict: database.TokenDic = database.getTokenDic();

      let eachResult: database.Token[] = [];

      dict.forEach((word) => {
        if (!word) return;
        if (typeof word !== "object") return;
        if (word.pos !== result.tokens[i].pos) return;
        if (word.conjugated_form !== result.tokens[i].conjugated_form) return;
        if (word.conjugated_type !== result.tokens[i].conjugated_type) return;
        if (word.pos_detail_1.includes("代名詞") === !result.tokens[i].pos_detail_1.includes("代名詞")) return;
        if (word.pos_detail_1.includes("接尾") === !result.tokens[i].pos_detail_1.includes("接尾")) return;
        if (word.pos_detail_1.includes("数") === !result.tokens[i].pos_detail_1.includes("数")) return;
        if (word.pos_detail_1.includes("非自立") === !result.tokens[i].pos_detail_1.includes("非自立")) return;
        if (/^[0-9]+$/.test(word.text) === !/^[0-9]+$/.test(result.tokens[i].text)) return;
        if (/^[１２３４５６７８９０]+$/.test(word.text) === !/^[１２３４５６７８９０]+$/.test(result.tokens[i].text)) return;
        if (/^[一二三四五六七八九〇十百千万億兆]+$/.test(word.text) === !/^[一二三四五六七八九〇十百千万億兆]+$/.test(result.tokens[i].text)) return;

        eachResult[eachResult.length] = word;
      });

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

    if (probabilityOfPenetrating >= 1) {
      result[i] = tokenManager.generateUnkToken(result[i]);
    }
  }

  return {
    id: `syn-${database.generateId()}`,
    tokens: result,
    negaposi: tokenManager.getTokensNegaposi(result)
  };
}

export function getDuplicationSyntaxsFromDatabase(syntax: database.Syntax): database.Syntax[] {
  const dict: database.SyntaxDic = database.getSyntaxDic();
  let result: database.Syntax[] = [];

  dict.forEach((dictSyntax) => {
    if (!syntax) return;
    if (typeof syntax !== "object") return;

    if (JSON.stringify(dictSyntax.tokens) === JSON.stringify(syntax.tokens)) result[result.length] = dictSyntax;
  });

  return result;
}

export async function replaceWithExistingSyntax(syntax: database.Syntax) {
  const duplicationSyntax = getDuplicationSyntaxsFromDatabase(syntax);

  if (duplicationSyntax.length !== 0) syntax = duplicationSyntax[0];

  return syntax;
}

export function cleanSyntaxForTwoTokensKnowledgeType(type: database.TwoTokensTypeKnowledgeTypes, syntax: database.Syntax): database.Syntax {
  let result: database.Syntax = { ...syntax };
  result.tokens = [];

  if (type === "x-is-y") {
    syntax.tokens.forEach((token, i) => {
      if (
        token.pos === "助詞" &&
        (
          token.pos_detail_1.includes("係助詞") ||
          token.pos_detail_2.includes("連語")
        ) &&
        (
          syntax.tokens[i - 1] &&
          (
            syntax.tokens[i - 1].pos === "名詞" ||
            syntax.tokens[i - 1].pos === "形容詞"
          ) &&
          syntax.tokens[i + 1] &&
          (
            syntax.tokens[i + 1].pos === "名詞" ||
            syntax.tokens[i + 1].pos === "形容詞"
          )
        )
      ) {
        let tempTokens = [];
        for (let index = i - 1; index >= 0 ; index--){
          const token = syntax.tokens[index];
          
          if (token.pos === "名詞" || token.pos === "形容詞") tempTokens[tempTokens.length] = token;
        }
  
        result.tokens.push(...tempTokens.reverse());
  
        result.tokens[result.tokens.length] = syntax.tokens[i];
  
        for (let index = i + 1; index < syntax.tokens.length; index++) {
          const token = syntax.tokens[index];
          
          if (token.pos === "名詞" || token.pos === "形容詞") result.tokens[result.tokens.length] = token;
        }
      }
    });
  } else if (type === "x-can-y") {
    syntax.tokens.forEach((token, i) => {
      if (
        token.pos === "助詞" &&
        (
          (
            token.pos_detail_1.includes("係助詞") ||
            token.pos_detail_2.includes("連語")
          ) &&
          (
            token.basic_form === "は" ||
            token.basic_form === "も" ||
            token.basic_form === "って"
          )
        ) &&
        (
          (
            syntax.tokens[i - 1] &&
            (
              syntax.tokens[i - 1].pos === "名詞" ||
              syntax.tokens[i - 1].pos === "形容詞"
            )
          ) ||
          syntax.tokens[i + 1] &&
          (
            syntax.tokens[i + 1].pos_detail_1.includes("係助詞") &&
            syntax.tokens[i + 1].pos_detail_2.includes("連語") &&
            (
              syntax.tokens[i + 1].basic_form === "は" ||
              syntax.tokens[i + 1].basic_form === "が" ||
              syntax.tokens[i + 1].basic_form === "も"
            )
          ) &&
          syntax.tokens[i + 2] &&
          (
            syntax.tokens[i + 2].pos === "動詞" &&
            syntax.tokens[i + 2].basic_form === "できる"
          )
        )
      ) {
        let tempTokens = [];
        for (let index = i - 1; index >= 0 ; index--){
          const token = syntax.tokens[index];
          
          if (token.pos === "名詞" || token.pos === "形容詞") tempTokens[tempTokens.length] = token;
        }
  
        result.tokens.push(...tempTokens.reverse());
  
        result.tokens[result.tokens.length] = syntax.tokens[i];
        
        if (syntax.tokens[i + 1]) result.tokens[result.tokens.length] = syntax.tokens[i + 1];
      }
    });
  }

  return result;
}

export function getSyntaxByQuestionType(type: database.QuestionType): database.Syntax[] {
  const dict = database.getSyntaxDic();
  let result: database.Syntax[] = [];
  dict.forEach((syntax) => {
    if (syntax.mean && syntax.mean[0].question?.type === type) {
      result[result.length] = syntax;
    }
  });

  return result;
}