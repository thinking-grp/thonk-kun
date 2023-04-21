import * as database from "../lib/database";
import fs from "fs";

describe("database", () => {
  it("database.generateId()", () => {
    const result = database.generateId();
    expect(result.length).toBe(12);
  });

  it("database.getKnowledgeDic()", () => {
    database.getKnowledgeDic();
    const file = JSON.parse(
      fs.readFileSync(`${__dirname}/../assets/knowledge_dictionary.db`, {
        encoding: "utf-8",
      })
    );
    expect(Array.isArray(file)).toBe(true);
  });

  it("database.getReplySyntaxDic()", () => {
    database.getReplySyntaxDic();
    const file = JSON.parse(
      fs.readFileSync(`${__dirname}/../assets/reply_syntax_dictionary.db`, {
        encoding: "utf-8",
      })
    );
    expect(Array.isArray(file)).toBe(true);
  });

  it("database.getSyntaxDic()", () => {
    database.getSyntaxDic();
    const file = JSON.parse(
      fs.readFileSync(`${__dirname}/../assets/syntax_dictionary.db`, {
        encoding: "utf-8",
      })
    );
    expect(Array.isArray(file)).toBe(true);
  });

  it("database.getTokenDic()", () => {
    database.getTokenDic();
    const file = JSON.parse(
      fs.readFileSync(`${__dirname}/../assets/token_dictionary.db`, {
        encoding: "utf-8",
      })
    );
    expect(Array.isArray(file)).toBe(true);
  });

  it("database.getTokenGroupDic()", () => {
    database.getTokenGroupDic();
    const file = JSON.parse(
      fs.readFileSync(`${__dirname}/../assets/token_group_dictionary.db`, {
        encoding: "utf-8",
      })
    );
    expect(Array.isArray(file)).toBe(true);
  });
});
