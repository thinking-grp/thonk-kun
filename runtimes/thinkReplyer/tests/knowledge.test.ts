import * as tokenManager from "../lib/token";
import * as syntaxManager from "../lib/syntax";
import * as knowledgeManager from "../lib/knowledge";
import fs from "fs";

describe("knowledge", () => {
  it("knowledgeManager.whichOfTwoTokensKnowledgeTypes() (x-is-y)", async () => {
    const text = "あなたはthinkReplyerです。";

    const tokens = tokenManager.convertKuromojisToTokens(
      await tokenManager.tokenize(text)
    );
  
    const syntax = syntaxManager.createSyntax(tokens);

    const result = knowledgeManager.whichOfTwoTokensKnowledgeTypes(syntax);

    expect(result).toBe("x-is-y");
  });

  it("knowledgeManager.whichOfTwoTokensKnowledgeTypes() (x-can-y)", async () => {
    const text = "私は掃除ができます。";

    const tokens = tokenManager.convertKuromojisToTokens(
      await tokenManager.tokenize(text)
    );
  
    const syntax = syntaxManager.createSyntax(tokens);

    const result = knowledgeManager.whichOfTwoTokensKnowledgeTypes(syntax);

    expect(result).toBe("x-can-y");
  });

  it("knowledgeManager.whichOfTwoTokensKnowledgeTypes() (x-or-y)", async () => {
    const text = "片付けか掃除です。";

    const tokens = tokenManager.convertKuromojisToTokens(
      await tokenManager.tokenize(text)
    );
  
    const syntax = syntaxManager.createSyntax(tokens);

    const result = knowledgeManager.whichOfTwoTokensKnowledgeTypes(syntax);

    expect(result).toBe("x-or-y");
  });
});