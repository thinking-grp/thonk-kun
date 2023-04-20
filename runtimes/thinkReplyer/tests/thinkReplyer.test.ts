import * as thinkReplyer from "../";

describe("thinkReplyer", () => {
  it("Ping pong!", async () => {
    const result = await thinkReplyer.interact("/##-ping");
    expect(result).toBe("Pong!");
  });
});
