import * as kuromoji from "kuromoji";
import * as tokenManager from "./token";
import * as tokenGroupManager from "./token_group";
import * as database from "./database";
import * as knowledgeManager from "./knowledge";

export const sentenceSplitSymbol: string[] = ["。", "！", "？", "!", "?", "."];

export function splitSentence(
  tokens: kuromoji.IpadicFeatures[] | database.Token[]
): database.Token[][] {
  const convertedTokens: database.Token[] =
    tokenManager.convertKuromojisToTokens(tokens);
  const result: database.Token[][] = [convertedTokens];

  for (let i = 0; i < convertedTokens.length; i++) {
    if (!convertedTokens[i + 1]) continue;

    let probabilityOfSeparation = 0;

    if (
      convertedTokens[i].pos_detail_1.includes("句点") &&
      convertedTokens[i].text === "。"
    ) {
      probabilityOfSeparation += 1;
    }

    if (convertedTokens[i].pos === "感動詞") {
      probabilityOfSeparation += 0.6;
    }

    if (convertedTokens[i - 1]) {
      if (convertedTokens[i - 1].pos_detail_1.includes("終助詞")) {
        probabilityOfSeparation += 0.8;
      }

      if (
        convertedTokens[i].pos === "記号" &&
        sentenceSplitSymbol.some((str) =>
          convertedTokens[i].text.includes(str)
        ) &&
        convertedTokens[i - 1].pos_detail_1.includes("終助詞")
      ) {
        probabilityOfSeparation += 0.8;
      }

      if (
        convertedTokens[i].pos === "記号" &&
        sentenceSplitSymbol.some((str) =>
          convertedTokens[i].text.includes(str)
        ) &&
        convertedTokens[i - 1].pos === "助動詞"
      ) {
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

export function isQuestion(tokens: database.Token[]): boolean {
  let result = 0;
  tokens.forEach((token, i) => {
    if (token.pos_detail_1.includes("終助詞") && tokens[i + 1]) {
      if (
        (tokens[i + 1].pos !== "名詞" || tokens[i + 1].pos !== "形容詞") &&
        !tokens[i + 1].pos_detail_1.includes("終助詞")
      ) {
        result += 0.2;
      }
    }

    if (tokenGroupManager.isWhatToken(token)) {
      result += 0.3;
    }

    if (token.text === "?" || token.text === "？") {
      if (tokens[i - 1]) {
        result += 1;
      }
    }
  });

  return result > 0;
}

export function createSyntaxMean(
  syntax: database.Syntax
): database.SyntaxMean[] {
  const filteredSyntax = cleanSyntax(syntax);

  const knowledge = knowledgeManager.createTwoTokensKnowledge(filteredSyntax);
  const result: database.Syntax = { ...syntax };

  result.tokens = [];

  if (!result.mean) {
    result.mean = [];

    result.mean[0] = {
      is: [],
      isQuestion: isQuestion(syntax.tokens),
      isImperative: isImperative(syntax.tokens),
    };
  }

  if (knowledge.can) {
    result.mean[0].can = knowledge.can;
  }

  if (knowledge.is) {
    result.mean[0].is = knowledge.is;
  }

  if (knowledge.or) {
    result.mean[0].or = knowledge.or;
  }

  const type = knowledgeManager.whichOfTwoTokensKnowledgeTypes(syntax);

  if (!result.mean[0].question) {
    result.mean[0].question = {
      type: "confirm",
    };
  }
  if (type === "x-is-y") {
    result.mean[0].question.type = type;
  } else if (type === "x-isnt-y") {
    result.mean[0].question.type = type;
  } else if (type === "x-can-y") {
    result.mean[0].question.type = type;
  } else if (type === "x-or-y") {
    result.mean[0].question.type = type;
  }

  return result.mean;
}

export function addSyntaxToDatabase(tokens: database.Syntax) {
  const dict: database.SyntaxDic = database.getSyntaxDic();

  dict[dict.length] = tokens;

  database.setSyntaxDic(dict);
}

export function isPositive(tokens: database.Token[]): boolean {
  let negativeOrPositive = 0;

  tokens.forEach((token) => {
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

    if (
      token.basic_form === "そう" &&
      token.pos === "副詞" &&
      token.pos_detail_1 === "助詞類接続"
    ) {
      negativeOrPositive += 1;
    }
  });
  return negativeOrPositive >= 1;
}

export function isImperative(tokens: database.Token[]): boolean {
  let probabilityOfImperative = 0;

  tokens.forEach((token, i) => {
    if (
      token.pos === "動詞" ||
      token.basic_form === "する" ||
      token.basic_form === "やる"
    ) {
      if (
        tokens[i + 1] &&
        (tokens[i + 1].basic_form === "て" ||
          tokens[i + 1].basic_form === "ろ" ||
          tokens[i + 1].conjugated_form.includes("命令") ||
          (tokens[i + 1].basic_form === "な" &&
            tokens[i + 1].pos_detail_1 === "終助詞"))
      )
        probabilityOfImperative += 0.5;
      if (token.conjugated_form !== "連用形") probabilityOfImperative -= 0.8;
      if (tokens[i - 1] && tokens[i - 1].basic_form === "を")
        probabilityOfImperative += 0.1;
      if (token.conjugated_form === "未然形") {
        probabilityOfImperative -= 0.05;

        if (
          (tokens[i + 1] && tokens[i + 1].basic_form === "ない") ||
          (tokens[i + 2] && tokens[i + 2].basic_form === "ない")
        ) {
          probabilityOfImperative += 0.1;
        }
      }
    }

    if (token.conjugated_form.includes("命令")) probabilityOfImperative += 1;
  });

  return probabilityOfImperative > 0;
}

export function generateFromRandomSyntax(): database.Token[] {
  const dict: database.SyntaxDic = database.getSyntaxDic();
  const result: database.Syntax =
    dict[Math.floor(Math.random() * (dict.length - 1 - 0) + 0)];

  result.tokens.forEach((word, i) => {
    if (!word) return;
    if (typeof word !== "object") return;

    if (word.pos_detail_3.includes("置換可能")) {
      if (word.pos_detail_1.includes("接続")) return;

      const dict: database.TokenDic = database.getTokenDic();

      const eachResult: database.Token[] = [];

      dict.forEach((word) => {
        if (!word) return;
        if (typeof word !== "object") return;
        if (word.pos !== result.tokens[i].pos) return;
        if (word.conjugated_form !== result.tokens[i].conjugated_form) return;
        if (word.conjugated_type !== result.tokens[i].conjugated_type) return;
        if (
          word.pos_detail_1.includes("代名詞") ===
          !result.tokens[i].pos_detail_1.includes("代名詞")
        )
          return;
        if (
          word.pos_detail_1.includes("接尾") ===
          !result.tokens[i].pos_detail_1.includes("接尾")
        )
          return;
        if (
          word.pos_detail_1.includes("数") ===
          !result.tokens[i].pos_detail_1.includes("数")
        )
          return;
        if (
          word.pos_detail_1.includes("非自立") ===
          !result.tokens[i].pos_detail_1.includes("非自立")
        )
          return;
        if (
          /^[0-9]+$/.test(word.text) === !/^[0-9]+$/.test(result.tokens[i].text)
        )
          return;
        if (
          /^[１２３４５６７８９０]+$/.test(word.text) ===
          !/^[１２３４５６７８９０]+$/.test(result.tokens[i].text)
        )
          return;
        if (
          /^[一二三四五六七八九〇十百千万億兆]+$/.test(word.text) ===
          !/^[一二三四五六七八九〇十百千万億兆]+$/.test(result.tokens[i].text)
        )
          return;

        eachResult[eachResult.length] = word;
      });

      result.tokens[i] =
        eachResult[Math.floor(Math.random() * (eachResult.length - 1 - 0) + 0)];
    }
  });

  return result.tokens;
}

export function createSyntax(tokens: database.Token[]): database.Syntax {
  const result = tokenManager.markReplaceableTokensWithPos(tokens, "名詞");

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
      result[i] = tokenManager.generateReplaceableToken(result[i]);
    }
  }

  return {
    id: `syn-${database.generateId()}`,
    tokens: result,
    negaposi: tokenManager.getTokensNegaposi(result),
  };
}

export function getDuplicationSyntaxsFromDatabase(
  syntax: database.Syntax
): database.Syntax[] {
  const dict: database.SyntaxDic = database.getSyntaxDic();
  const result: database.Syntax[] = [];

  dict.forEach((dictSyntax) => {
    if (!syntax) return;
    if (typeof syntax !== "object") return;

    if (JSON.stringify(dictSyntax.tokens) === JSON.stringify(syntax.tokens))
      result[result.length] = dictSyntax;
  });

  return result;
}

export function replaceWithExistingSyntax(syntax: database.Syntax) {
  const duplicationSyntax = getDuplicationSyntaxsFromDatabase(syntax);

  if (duplicationSyntax.length !== 0) syntax = duplicationSyntax[0];

  return syntax;
}

export function cleanSyntax(syntax: database.Syntax): database.Syntax {
  const result: database.Syntax = {
    id: syntax.id,
    tokens: [],
    negaposi: syntax.negaposi,
  };

  syntax.tokens.forEach((token) => {
    if (token.pos_detail_1 !== "空白")
      result.tokens[result.tokens.length] = token;
  });

  return result;
}

export function cleanSyntaxForTwoTokensKnowledgeType(
  type: database.TwoTokensTypeKnowledgeTypes,
  syntax: database.Syntax
): database.Syntax {
  const result: database.Syntax = { ...syntax };
  result.tokens = [];

  if (type === "x-is-y") {
    syntax.tokens.forEach((token, i) => {
      if (
        (token.pos === "助詞" ||
          token.pos_detail_1.includes("係助詞") ||
          token.pos_detail_2.includes("連語") ||
          token.text === "is") &&
        syntax.tokens[i - 1] &&
        (syntax.tokens[i - 1].pos === "名詞" ||
          syntax.tokens[i - 1].pos === "形容詞") &&
        syntax.tokens[i + 1] &&
        (syntax.tokens[i + 1].pos === "名詞" ||
          syntax.tokens[i + 1].pos === "形容詞")
      ) {
        const tempTokens = [];
        for (let index = i - 1; index >= 0; index--) {
          const token = syntax.tokens[index];

          if (token.pos === "名詞" || token.pos === "形容詞")
            tempTokens[tempTokens.length] = token;
        }

        result.tokens.push(...tempTokens.reverse());

        result.tokens[result.tokens.length] = syntax.tokens[i];

        for (let index = i + 1; index < syntax.tokens.length; index++) {
          const token = syntax.tokens[index];

          if (token.pos === "名詞" || token.pos === "形容詞")
            result.tokens[result.tokens.length] = token;
        }
      }
    });
  } else if (type === "x-can-y") {
    syntax.tokens.forEach((token, i) => {
      if (
        token.pos === "助詞" &&
        (token.pos_detail_1.includes("係助詞") ||
          token.pos_detail_2.includes("連語")) &&
        (token.basic_form === "は" ||
          token.basic_form === "も" ||
          token.basic_form === "って") &&
        ((syntax.tokens[i - 1] &&
          (syntax.tokens[i - 1].pos === "名詞" ||
            syntax.tokens[i - 1].pos === "形容詞")) ||
          (syntax.tokens[i + 1] &&
            syntax.tokens[i + 1].pos_detail_1.includes("係助詞") &&
            syntax.tokens[i + 1].pos_detail_2.includes("連語") &&
            (syntax.tokens[i + 1].basic_form === "は" ||
              syntax.tokens[i + 1].basic_form === "が" ||
              syntax.tokens[i + 1].basic_form === "も") &&
            syntax.tokens[i + 2] &&
            syntax.tokens[i + 2].pos === "動詞" &&
            syntax.tokens[i + 2].basic_form === "できる"))
      ) {
        const tempTokens = [];
        for (let index = i - 1; index >= 0; index--) {
          const token = syntax.tokens[index];

          if (token.pos === "名詞" || token.pos === "形容詞")
            tempTokens[tempTokens.length] = token;
        }

        result.tokens.push(...tempTokens.reverse());

        result.tokens[result.tokens.length] = syntax.tokens[i];

        if (syntax.tokens[i + 1])
          result.tokens[result.tokens.length] = syntax.tokens[i + 1];
      }
    });
  }

  return result;
}

export function getSyntaxByQuestionType(
  type: database.QuestionType
): database.Syntax[] {
  const dict = database.getSyntaxDic();
  const result: database.Syntax[] = [];
  dict.forEach((syntax) => {
    if (syntax.mean && syntax.mean[0].question?.type === type) {
      result[result.length] = syntax;
    }
  });

  return result;
}

export function getSyntaxRequirementPos(syntax: database.Syntax): string[] {
  const result: string[] = [];
  syntax.tokens.forEach((token) => {
    if (token.pos_detail_1.includes("／置換可能"))
      result[result.length] = token.pos;
  });

  return result;
}

export function getUsableSyntaxs(
  replaceTokens: database.Token[][]
): database.Syntax[] {
  const dict: database.SyntaxDic = database.getSyntaxDic();

  const result: database.Syntax[] = [];

  dict.forEach((syntax) => {
    const syntaxRequirements: string[] = getSyntaxRequirementPos(syntax);

    const syntaxResult: boolean[] = [];
    let donedReplaceToken = 0;

    syntaxRequirements.forEach((requirement) => {
      replaceTokens.forEach((tokens) => {
        for (let i = donedReplaceToken; i < tokens.length; i++) {
          const token = tokens[i];

          if (token.pos === requirement) {
            donedReplaceToken = i;
            syntaxResult[syntaxResult.length] = true;
            return;
          } else if (i === tokens.length - 1) {
            syntaxResult[syntaxResult.length] = false;
          }
        }
      });

      if (!syntaxResult.includes(false)) result[result.length] = syntax;
    });
  });

  return result;
}

export function getSimillarTokens(token: database.Token): database.Token[] {
  const dict: database.TokenGroupDic = database.getTokenGroupDic();

  const result: database.Token[] = [];

  dict.forEach((tokenGroup) => {
    if (isSimillarMeanTokenGroup(tokenGroup.id, token)) {
      const tokens: database.Token[] = [];
      tokenGroup.tokenIds.forEach((tokensId) => {
        tokensId.forEach((tokenId) => {
          tokens[tokens.length] =
            tokenManager.getTokensByIdFromDatabase(tokenId);
        });
      });

      result.push(...tokens);
    }
  });

  return result;
}

export function isSimillarMeanTokenGroup(
  tokenGroupId: string,
  token: database.Token
): boolean {
  const tokenGroup = tokenGroupManager.getTokenGroupById(tokenGroupId)[0];

  let probabilityOfSimillar = 0;
  tokenGroup.tokenIds.forEach((tokensId) => {
    tokensId.forEach((tokenId) => {
      const dbToken = tokenManager.getTokensByIdFromDatabase(tokenId);

      const dbTokenKnowledges = knowledgeManager.getKnowledgeFromDatabase(
        "x-is-y",
        [dbToken]
      );

      if (dbTokenKnowledges.length !== 0) {
        const tokenKnowledges = knowledgeManager.getKnowledgeFromDatabase(
          "x-is-y",
          [token]
        );

        dbTokenKnowledges.forEach((dbTokenKnowledge) => {
          tokenKnowledges.forEach((tokenKnowledge) => {
            if (
              dbTokenKnowledge.type === "x-is-y" &&
              tokenKnowledge.type === "x-is-y" &&
              dbTokenKnowledge.is &&
              tokenKnowledge.is
            ) {
              if (dbTokenKnowledge.is[0][1] && tokenKnowledge.is[0][1])
                probabilityOfSimillar += 1;

              if (dbTokenKnowledge.is) {
                dbTokenKnowledge.is[0][1].forEach((dbKnowledgeToken) => {
                  if (tokenKnowledge.is) {
                    tokenKnowledge.is[0][1].forEach((knowledgeToken) => {
                      if (dbKnowledgeToken.text === knowledgeToken.text)
                        probabilityOfSimillar += 0.01;
                      else probabilityOfSimillar -= 0.0075;
                    });
                  }
                });
              }
            }
          });
        });
      }
    });
  });

  return probabilityOfSimillar > 0;
}
