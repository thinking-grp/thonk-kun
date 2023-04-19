import * as tokenManager from "./token";
import * as syntaxManager from "./syntax";
import * as database from "./database";
import * as knowledgeManager from "./knowledge";

export function addOriginMeansToOrigin(
  syntax: database.Syntax,
  mean: database.SyntaxMean
): database.SyntaxMean {
  if (!mean) throw new Error();
  if (!mean.isQuestion) {
    if (syntaxManager.isQuestion(syntax)) mean.isQuestion = true;
  }

  if (!mean.question && syntax.mean && syntax.mean[0]) {
    mean.question = {
      type: whichQuestionType(syntax),
      // when: undefined,
      // where: undefined,
      // who: undefined,
      // what: syntax.mean[0].is[0][0]
    };
  }

  return mean;
}

export function whichQuestionType(
  syntax: database.Syntax
): database.QuestionType {
  const twoTokensType = knowledgeManager.whichOfTwoTokensKnowledgeTypes(syntax);

  let type: database.QuestionType;

  if (twoTokensType === "x-can-y") {
    type = "x-can-y";
  } else if (twoTokensType === "x-is-y") {
    type = "x-is-y";
  } else if (twoTokensType === "x-isnt-y") {
    type = "x-isnt-y";
  } else {
    type = "confirm";
  }

  return type;
}

export function addReplyMeansToReply(
  syntax: database.Syntax,
  mean: database.SyntaxMean
): database.SyntaxMean {
  if (!mean) throw new Error();
  if (!mean.isReply) {
    if (!syntaxManager.isQuestion(syntax)) mean.isReply = true;
  }

  if (!mean.reply) {
    mean.reply = {
      positive: syntaxManager.isPositive(syntax.tokens),
    };
  }

  return mean;
}

export function createReplySyntax(
  syntaxs: [database.Syntax, database.Syntax]
): database.ReplySyntax {
  if (!syntaxs[0].mean) throw new Error("aa");
  if (!syntaxs[1].mean) throw new Error("aa");
  if (!syntaxs[0].mean[0] || !syntaxs[1].mean[0])
    return {
      id: `rsx-${database.generateId()}`,
      syntax: syntaxs,
      mean: [],
      negaposi:
        tokenManager.getTokensNegaposi(syntaxs[0].tokens) +
        tokenManager.getTokensNegaposi(syntaxs[1].tokens) / 2,
    };

  const means: database.SyntaxMean[] = [];

  means[means.length] = addReplyMeansToReply(syntaxs[1], syntaxs[1].mean[0]);

  means[means.length] = addOriginMeansToOrigin(syntaxs[0], syntaxs[0].mean[0]);

  return {
    id: `rsx-${database.generateId()}`,
    syntax: syntaxs,
    mean: means,
    negaposi:
      tokenManager.getTokensNegaposi(syntaxs[0].tokens) +
      tokenManager.getTokensNegaposi(syntaxs[1].tokens) / 2,
  };
}

export function addReplySyntaxToDatabase(replySyntax: database.ReplySyntax) {
  const dict: database.ReplySyntaxDic = database.getReplySyntaxDic();

  dict[dict.length] = replySyntax;

  database.setReplySyntaxDic(dict);
}
