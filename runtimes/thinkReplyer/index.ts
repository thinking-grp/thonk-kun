import * as tokenManager from "./lib/token";
import * as syntaxManager from "./lib/syntax";
import * as replySyntaxManager from "./lib/reply_syntax";
import * as knowledgeManager from "./lib/knowledge";
import * as generator from "./lib/generate";

export async function train(trainingData: any, options: any) {
  if (!Array.isArray(trainingData)) {
    throw new Error(`
      thinkReplyer ERROR:
      trainingData is not [Token[], Token[]][] type.
    `);
  }

  if (trainingData.length !== 2) {
    throw new Error(`
      thinkReplyer ERROR:
      trainingData is not of [Token[], Token[]][] type.
    `);
  }

  if (typeof trainingData[0] !== "string") {
    throw new Error(`
      thinkReplyer ERROR:
      trainingData is not of [Token[], Token[]][] type.
    `);
  }

  if (typeof trainingData[1] !== "string") {
    throw new Error(`
      thinkReplyer ERROR:
      trainingData is not of [Token[], Token[]][] type.
    `);
  }

  const tokens = await tokenManager.tokenize(trainingData[0]);
  const tokens2 = await tokenManager.tokenize(trainingData[1]);

  const tokensNegaposi = tokenManager.getTokensNegaposi(tokens);

  const convertedTokens = tokenManager.convertKuromojisToTokens(
    tokens,
    tokensNegaposi
  );

  tokenManager.addTokensToDatabase(convertedTokens);

  const filteredTokens = tokenManager.replaceExistingTokens(convertedTokens);

  const tokens2Negaposi = tokenManager.getTokensNegaposi(tokens2);

  const convertedTokens2 = tokenManager.convertKuromojisToTokens(
    tokens2,
    tokens2Negaposi
  );

  tokenManager.addTokensToDatabase(convertedTokens2);

  const filteredTokens2 = tokenManager.replaceExistingTokens(convertedTokens2);

  const splitedTokens = syntaxManager.splitSentence(filteredTokens);

  const splitedTokens2 = syntaxManager.splitSentence(filteredTokens2);

  const syntax = syntaxManager.createSyntax(filteredTokens);

  const syntax2 = syntaxManager.createSyntax(filteredTokens2);

  splitedTokens.forEach((tokens) => {
    const syntax = syntaxManager.createSyntax(tokens);

    if (syntaxManager.getDuplicationSyntaxsFromDatabase(syntax).length === 0) {
      syntax.mean = syntaxManager.createSyntaxMean(syntax);

      syntaxManager.addSyntaxToDatabase(syntax);

      if (!syntax.mean) return;
    }

    const replacedSyntax = syntaxManager.replaceWithExistingSyntax(syntax);

    replacedSyntax.mean = syntaxManager.createSyntaxMean(replacedSyntax);

    if (
      knowledgeManager.isTwoTokensKnowledge(replacedSyntax) &&
      !syntaxManager.isQuestion(replacedSyntax.tokens)
    ) {
      const knowledge =
        knowledgeManager.createTwoTokensKnowledge(replacedSyntax);

      knowledgeManager.addKnowledgeToDatabase(knowledge);
    }
  });

  splitedTokens2.forEach((tokens) => {
    const syntax = syntaxManager.createSyntax(tokens);

    if (syntaxManager.getDuplicationSyntaxsFromDatabase(syntax).length === 0) {
      syntax.mean = syntaxManager.createSyntaxMean(syntax);

      syntaxManager.addSyntaxToDatabase(syntax);

      if (!syntax.mean) return;
    } else {
      return;
    }
  });

  if (
    syntaxManager.getDuplicationSyntaxsFromDatabase(syntax).length === 1 &&
    syntaxManager.getDuplicationSyntaxsFromDatabase(syntax2).length === 1
  ) {
    const replySyntax = replySyntaxManager.createReplySyntax([syntax, syntax2]);

    replySyntaxManager.addReplySyntaxToDatabase(replySyntax);

    if (
      knowledgeManager.isTwoTokensKnowledge(syntax) &&
      !syntaxManager.isQuestion(syntax.tokens)
    ) {
      const knowledge = knowledgeManager.createTwoTokensKnowledge(syntax);

      knowledgeManager.addKnowledgeToDatabase(knowledge);
    }

    if (
      knowledgeManager.isTwoTokensKnowledge(syntax2) &&
      !syntaxManager.isQuestion(syntax2.tokens)
    ) {
      const knowledge2 = knowledgeManager.createTwoTokensKnowledge(syntax2);

      knowledgeManager.addKnowledgeToDatabase(knowledge2);
    }
  }
}

export async function interact(
  text: string,
  history: string[] = [],
  options?: generator.GenerateOptions
): Promise<string> {
  const result = await generator.generateReply(text, history, options);

  return tokenManager.convertTokensToString(result);
}
