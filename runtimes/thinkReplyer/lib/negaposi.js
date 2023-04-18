const analyse = require("negaposi-analyzer-ja");
const tokenManager = require("./token.ts");
const database = require("./database.ts");
const kuromoji = require("kuromoji");

/**
 * @param { database.Token[] | kuromoji.IpadicFeatures[] } tokens 
 * @returns { number }
 */
function getTokensNegaposi(tokens) {
  if (tokenManager.implementsTokens(tokens)) {
    let convertedTokens = [];

    tokens.forEach((token) => {
      convertedTokens[convertedTokens.length] = token.raw_data;
    });

    return Number(analyse(convertedTokens));
  } else {
    return Number(analyse(tokens));
  }
}

module.exports = {
  getTokensNegaposi
}