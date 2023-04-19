import * as database from "./database";
import * as tokenManager from "./token";

export function createTokenGroup(tokensId: string[][], negaposi: number): database.TokenGroup {
  return {
    id: `tng-${database.generateId()}`,
    tokenIds: tokensId,
    negaposi
  };
}

export function getTokenGroupById(id: string): database.TokenGroup[] {
  let dict: database.TokenGroupDic = database.getTokenGroupDic();

  let result: database.TokenGroup[] = [];
  dict.forEach((tokenGroup) => {
    if (tokenGroup.id === id) result[result.length] = tokenGroup;
  });

  return result;
}

export function editTokenGroupById(id: string, editedTokenGroup: database.TokenGroup) {
  let dict: database.TokenGroupDic = database.getTokenGroupDic();

  dict.forEach((tokenGroup, i) => {
    if (tokenGroup.id === id) dict[i] = editedTokenGroup;
  });

  database.setTokenGroupDic(dict);
}

export function addWhatTokens(tokenId: string, negaposi: number) {
  let tokenGroups = getTokenGroupById("tng-what");

  const token = tokenManager.getTokensByIdFromDatabase(tokenId);

  if (!token) throw new Error;

  if (tokenGroups.length === 0) {

    const tokenGroup: database.TokenGroup = {
      id: "tng-what",
      tokenIds: [ [tokenId] ],
      negaposi: negaposi
    };

    addTokenGroupToDatabase(tokenGroup);

    return;
  }

  for (let index = 0; index < tokenGroups[0].tokenIds.length; index++) {
    for (let i = 0; i < tokenGroups[0].tokenIds[index].length; i++) {
      const dbTokenId = tokenGroups[0].tokenIds[index][i];

      if (dbTokenId === tokenId) return;
      if (tokenManager.getTokensByIdFromDatabase(dbTokenId).text === token.text) return;
    }
  }

  tokenGroups[0].tokenIds[tokenGroups[0].tokenIds.length] = [];

  tokenGroups[0].tokenIds[tokenGroups[0].tokenIds.length - 1][tokenGroups[0].tokenIds[tokenGroups[0].tokenIds.length - 1].length] = tokenId;

  editTokenGroupById("tng-what", tokenGroups[0]);
}

export function isWhatToken(token: database.Token): boolean {
  let dict: database.TokenGroup[] = getTokenGroupById("tng-what");

  let result: string[] = [];

  if (dict[0]) {
    dict[0].tokenIds.forEach((tokensId) => {
    
      tokensId.forEach((tokenId) => {
        const databaseToken = tokenManager.getTokensByIdFromDatabase(tokenId);
  
        let token2 = { ...token };
        let databaseToken2 = { ...databaseToken };
    
        token2.id = "";
        databaseToken2.id = "";
    
        if (token2.text === databaseToken2.text) result[result.length] = tokenId;
      });
    });
  }

  return result.length !== 0;
}

export function addTokenGroupToDatabase(tokenGroup: database.TokenGroup) {
  let dict: database.TokenGroupDic = database.getTokenGroupDic();

  dict[dict.length] = tokenGroup;

  database.setTokenGroupDic(dict);
}

export function includesInTokenGroup(tokenGroupId: string, token: database.Token): boolean {
  const tokenGroups = getTokenGroupById(tokenGroupId);

  for (let i = 0; i < tokenGroups.length; i++) {
    const tokenGroup = tokenGroups[i];
    
    return tokenGroup.tokenIds[tokenGroup.tokenIds.length].includes(token.id);
  }

  return false;
}