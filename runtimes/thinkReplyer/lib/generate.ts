import * as tokenManager from "./token";
import * as database from "./database";
import * as syntaxManager from "./syntax";
import * as knowledgeManager from "./knowledge";

export type GenerateOptions = {
  allowTrain: boolean;
};

export async function generateReply(text: string, options: GenerateOptions = {
  allowTrain: false
}): Promise<database.Token[]> {
  let result: database.Token[] = [];
  const replyTokens = await tokenManager.tokenize(text);
  
  const tokens2Negaposi = tokenManager.getTokensNegaposi(replyTokens);

  const convertedReplyTokens = tokenManager.convertKuromojiToToken(replyTokens, tokens2Negaposi);

  let filteredReplyTokens = await tokenManager.replaceWithExistingTokens(convertedReplyTokens);

  let replySyntax = syntaxManager.createSyntax(filteredReplyTokens);

  if (!replySyntax.mean) replySyntax.mean = syntaxManager.createSyntaxMean(replySyntax);

  if (!replySyntax.mean[0]) throw new Error;

  if (options.allowTrain) {
    tokenManager.addTokensToDatabase(filteredReplyTokens);

    if (syntaxManager.getDuplicationSyntaxsFromDatabase(replySyntax).length === 0) {
      syntaxManager.addSyntaxToDatabase(replySyntax);
    }
  }

  if (replySyntax.mean[0].isQuestion) {
    if (replySyntax.mean[0].question) {
      if (replySyntax.mean[0].question.type === "x-is-y" && replySyntax.mean[0].is) {
        const knowledges = knowledgeManager.getKnowledgeFromDatabase(replySyntax.mean[0].question.type, replySyntax.mean[0].is[0][0]);

        if (knowledges.length === 0) {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

          result = tokens;
        } else if (knowledges[0].type !== "x-is-y" || !knowledges[0].is) {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

          result = tokens;
        } else {
          let tokens;
          if (tokenManager.convertTokensToString(knowledges[0].is[0][0]) === "あなた") {
            tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize(`私は${tokenManager.convertTokensToString(knowledges[0].is[0][1])}です。`));
          } else {
            tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize(`${tokenManager.convertTokensToString(knowledges[0].is[0][0])}は${tokenManager.convertTokensToString(knowledges[0].is[0][1])}です。`));
          }

          result = tokens;
        }
      } else if (replySyntax.mean[0].question.type === "x-isnt-y" && replySyntax.mean[0].is) {
        const knowledges = knowledgeManager.getKnowledgeFromDatabase(replySyntax.mean[0].question.type, replySyntax.mean[0].is[0][0]);

        if (knowledges.length === 0) {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

          result = tokens;
        } else if (knowledges[0].type !== "x-isnt-y" || !knowledges[0].is) {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

          result = tokens;
        } else {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize(`${tokenManager.convertTokensToString(knowledges[0].is[0][0])}は${tokenManager.convertTokensToString(knowledges[0].is[0][1])}です。`));

          result = tokens;
        }
      } else if (replySyntax.mean[0].question.type === "x-can-y" && replySyntax.mean[0].can) {
        const knowledges = knowledgeManager.getKnowledgeFromDatabase(replySyntax.mean[0].question.type, replySyntax.mean[0].can[0].what);

        if (knowledges.length === 0) {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

          result = tokens;
        } else if (knowledges[0].type !== "x-can-y" || !knowledges[0].can) {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

          result = tokens;
        } else {
          const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize(`${tokenManager.convertTokensToString(knowledges[0].can[0].what)}はできません。`));

          result = tokens;
        }
      } else {
        const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("ごめんなさい、私にはわかりません...。"));

        result = tokens;
      }
    }
  } else {
    if (options.allowTrain) {
      if (syntaxManager.getDuplicationSyntaxsFromDatabase(replySyntax).length === 0) {
        replySyntax.mean = syntaxManager.createSyntaxMean(replySyntax);
    
        syntaxManager.addSyntaxToDatabase(replySyntax);
      }

      const filteredSyntax = syntaxManager.cleanSyntaxForTwoTokensKnowledgeType("x-is-y", replySyntax);

      if (knowledgeManager.isTwoTokensKnowledge(filteredSyntax) && !syntaxManager.isQuestion(filteredSyntax)) {
        const knowledge = knowledgeManager.createTwoTokensKnowledge(filteredSyntax);
  
        console.log(knowledge)
        knowledgeManager.addKnowledgeToDatabase(knowledge);
      }

      console.log(filteredSyntax);
      const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("そうなんですね。覚えました。"));

      result = tokens;
    } else {
      const tokens = tokenManager.convertKuromojiToToken(await tokenManager.tokenize("そうなんですね。教えてくれてありがとう。"));

      result = tokens;
    }
  }

  return result;
}