import * as tokenManager from "./token";
import * as database from "./database";
import * as syntaxManager from "./syntax";

export async function createMean(meaningString: string): Promise<database.TokenMean> {
  let result: database.TokenMean = {
    usage: []
  };

  const meaning = await tokenManager.tokenize(meaningString);

  result.negaposi = tokenManager.getTokensNegaposi(meaning);

  const separatedMeaning = syntaxManager.splitSentence(meaning);

  result.usage = separatedMeaning;

  return result;
}

export function addMeanToDatabase(tokenId: string, mean: database.TokenMean) {
  let token = tokenManager.getTokensByIdFromDatabase(tokenId);

  token.mean = mean;

  tokenManager.replaceTokenOfDatabaseById(tokenId, token);
}