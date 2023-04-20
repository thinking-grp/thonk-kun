import * as database from "./database";
import * as syntaxManager from "./syntax";

export function whichOfTwoTokensKnowledgeTypes(
  syntax: database.Syntax
): database.TwoTokensTypeKnowledgeTypes {
  let type: database.TwoTokensTypeKnowledgeTypes = "x-is-y";

  syntax.tokens.forEach((token, i) => {
    // ○○"は"○○です・○○"は"○○にあります
    if (
      (syntax.tokens[i - 1] &&
        syntax.tokens[i - 1].pos === "名詞" &&
        token.pos_detail_1.includes("係助詞") &&
        token.basic_form === "は") ||
      token.text === "is" ||
      token.text === "って"
    ) {
      for (let index = i; index < syntax.tokens.length; index++) {
        // ○○は"○○"です・○○は"○○"にあります
        if (syntax.tokens[index].pos === "名詞") {
          // ○○は○○"です"・○○は○○"に"あります
          if (
            syntax.tokens[index + 1] &&
            syntax.tokens[index + 1].pos === "助詞"
          ) {
            // ○○は○○に"あり"ます or ○○は○○では"ない"です
            if (
              syntax.tokens[index + 2] &&
              syntax.tokens[index + 2].conjugated_form === "未然形"
            ) {
              type = "x-isnt-y";
            } else {
              // ○○は○○に"あり"ます or ○○は○○と"似て"います
              if (syntax.tokens[index + 1].basic_form === "の") {
                if (syntax.tokens[index + 2].basic_form === "ため") {
                  type = "x-is-for-y";
                }
              } else if (syntax.tokens[index + 1].basic_form === "に") {
                // ○○は○○に"あり"ます or ○○は○○に"似て"います
                if (syntax.tokens[index + 2].basic_form === "似て") {
                  if (
                    syntax.tokens[index + 3] &&
                    syntax.tokens[index + 3].basic_form === "いる"
                  ) {
                    type = "x-is-similar-to-y";
                  }
                } else if (syntax.tokens[index + 2].basic_form === "ある") {
                  type = "x-is-in-y";
                }
              }
            }
          } else if (
            syntax.tokens[index + 1] &&
            syntax.tokens[index + 1].basic_form === "できる"
          ) {
            type = "x-can-y";
          } else if (
            syntax.tokens[index + 1] &&
            syntax.tokens[index + 1].pos === "助動詞"
          ) {
            // ○○は○○"です" or ○○は○○"では"
            type = "x-is-y";
          }
        }
      }
    }

    if (token.basic_form === "できる") {
      type = "x-can-y";
    }
  });

  return type;
}

export function createXIsYTypeKnowledge(
  syntax: database.Syntax
): database.Is[] {
  const result: database.Syntax = { ...syntax };
  result.tokens = [];

  if (!result.mean) {
    result.mean = [];

    result.mean[0] = {
      is: [],
      isQuestion: syntaxManager.isQuestion(syntax.tokens),
    };
  }

  syntax.tokens.forEach((token, i) => {
    if (
      (token.pos === "助詞" ||
        ((token.pos_detail_1.includes("係助詞") ||
          token.pos_detail_2.includes("連語")) &&
          (token.basic_form === "は" || token.basic_form === "も")) ||
        token.text === "is") &&
      syntax.tokens[i - 1] &&
      (syntax.tokens[i - 1].pos === "名詞" ||
        syntax.tokens[i - 1].pos === "形容詞") &&
      syntax.tokens[i + 1] &&
      (syntax.tokens[i + 1].pos === "名詞" ||
        syntax.tokens[i + 1].pos === "形容詞")
    ) {
      if (!result.mean) {
        result.mean = [];

        result.mean[0] = {
          is: [[[], []]],
          isQuestion: syntaxManager.isQuestion(syntax.tokens),
        };
      }

      if (!result.mean[0].is) {
        result.mean[0].is = [];
      }

      if (!result.mean[0].is[0]) {
        result.mean[0].is[0] = [[], []];
      }
      result.mean[0].is[0][0] = [];

      const tempTokens = [];
      for (let index = i - 1; index >= 0; index--) {
        const token = syntax.tokens[index];
        if (token.pos === "名詞" || token.pos === "形容詞")
          tempTokens[tempTokens.length] = token;
      }

      result.mean[0].is[0][0].push(...tempTokens.reverse());

      result.mean[0].is[0][1] = [];

      for (let index = i + 1; index < syntax.tokens.length; index++) {
        const token = syntax.tokens[index];
        if (token.pos === "名詞" || token.pos === "形容詞")
          result.mean[0].is[0][1][result.mean[0].is[0][1].length] = token;
      }
    }
  });

  if (!result.mean[0].is) {
    result.mean[0].is = [];
  }

  return result.mean[0].is;
}

export function createXCanYTypeKnowledge(
  syntax: database.Syntax
): database.Can[] {
  const result: database.Syntax = { ...syntax };
  result.tokens = [];

  if (!result.mean) {
    result.mean = [];

    result.mean[0] = {
      is: [],
      isQuestion: syntaxManager.isQuestion(syntax.tokens),
    };
  }

  syntax.tokens.forEach((token, i) => {
    if (
      token.pos === "助詞" &&
      (((token.pos_detail_1.includes("係助詞") ||
        token.pos_detail_2.includes("連語")) &&
        token.basic_form === "は") ||
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
      if (!result.mean) {
        result.mean = [];

        result.mean[0] = {
          is: [[[], []]],
          isQuestion: syntaxManager.isQuestion(syntax.tokens),
        };
      }

      if (!result.mean[0].can) {
        result.mean[0].can = [
          {
            what: [],
          },
        ];
      }

      result.mean[0].can[0].what = [];

      const tempTokens = [];
      for (let index = i - 1; index >= 0; index--) {
        const token = syntax.tokens[index];
        if (token.pos === "名詞" || token.pos === "形容詞")
          tempTokens[tempTokens.length] = token;
      }

      result.mean[0].can[0].what.push(...tempTokens.reverse());

      // if (syntax.tokens[i + 1].pos === "動詞" && syntax.tokens[i + 1].basic_form === "できる") {
      //   if (syntax.tokens[i + 1].conjugated_form === "未然形") {
      //     result.mean[0].can[0].canI = false;
      //   } else if (syntax.tokens[i + 1].conjugated_form === "連用形" || syntax.tokens[i + 1].conjugated_form === "基本形") {
      //     result.mean[0].can[0].canI = true;
      //   }
      // }
    }
  });

  if (!result.mean[0].can) {
    result.mean[0].can = [];
  }

  return result.mean[0].can;
}

export function createTwoTokensKnowledge(
  syntax: database.Syntax
): database.TwoTokensTypeKnowledge {
  const type = whichOfTwoTokensKnowledgeTypes(syntax);

  let is: database.Is[] = [];
  let can: database.Can[] = [];

  if (type === "x-is-y") {
    const filteredSyntax = syntaxManager.cleanSyntaxForTwoTokensKnowledgeType(
      type,
      syntax
    );

    is = createXIsYTypeKnowledge(filteredSyntax);
  } else if (type === "x-can-y") {
    const filteredSyntax = syntaxManager.cleanSyntaxForTwoTokensKnowledgeType(
      type,
      syntax
    );

    can = createXCanYTypeKnowledge(filteredSyntax);
  }

  return {
    id: `knl-${database.generateId()}`,
    type,
    is,
    can,
    isQuestion: syntaxManager.isQuestion(syntax.tokens),
  };
}

export function isTwoTokensKnowledge(syntax: database.Syntax): boolean {
  const syntaxMean = syntaxManager.createSyntaxMean(syntax);

  if (!syntaxMean[0]) throw new Error();

  return Boolean(
    (syntaxMean[0].can &&
      syntaxMean[0].can[0] &&
      syntaxMean[0].can[0].what &&
      syntaxMean[0].can[0].what.length !== 0) ||
      (syntaxMean[0].is &&
        syntaxMean[0].is[0] &&
        syntaxMean[0].is[0][0] &&
        syntaxMean[0].is[0][1] &&
        (syntaxMean[0].is[0][0].length !== 0 ||
          syntaxMean[0].is[0][1].length !== 0) &&
        !syntaxManager.isQuestion(syntax.tokens))
  );
}

export function addKnowledgeToDatabase(knowledge: database.Knowledge) {
  const dict: database.KnowledgeDic = database.getKnowledgeDic();

  dict[dict.length] = knowledge;

  database.setKnowledgeDic(dict);
}

export function getDuplicationKnowledges(
  knowledge: database.Knowledge
): database.Knowledge[] {
  const dict: database.KnowledgeDic = database.getKnowledgeDic();
  const result: database.Knowledge[] = [];

  dict.forEach((dictKnowledge) => {
    if (!knowledge) return;
    if (typeof knowledge !== "object") return;

    dictKnowledge.id = "";
    knowledge.id = "";
    if (JSON.stringify(dictKnowledge) === JSON.stringify(dictKnowledge))
      result[result.length] = dictKnowledge;
  });

  return result;
}

// export const howTo = {
//   getSteps(syntaxs: database.Syntax[]): database.HowToStep[] {
//     const result: database.HowToStep[] = [];
//     syntaxs.forEach((syntax) => {
//       const stepOriginalString = "";
//       const stepString = "";

//       syntax.tokens.forEach((token) => {});
//     });

//     return result;
//   },
// };

export function getKnowledgeFromDatabase(
  type: database.KnowledgeTypes,
  what?: database.Token[]
): database.Knowledge[] {
  const dict = database.getKnowledgeDic();

  const result: database.Knowledge[] = [];
  dict.forEach((knowledge) => {
    if (knowledge.type === type) {
      if (!what) {
        result[result.length] = knowledge;
      } else {
        if (knowledge.type === "x-is-y" || knowledge.type === "x-isnt-y") {
          if (
            knowledge.is &&
            JSON.stringify(knowledge.is[0][0]) === JSON.stringify(what)
          ) {
            result[result.length] = knowledge;
          }
        }
      }
    }
  });

  return result;
}
