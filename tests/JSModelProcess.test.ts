import { JSModelProcess } from "../lib";

describe("JSModelProcess", () => {
  let jsModelProcess: JSModelProcess;

  beforeEach(() => {
    jsModelProcess = new JSModelProcess({
      modelPath: `${__dirname}/../examples/jsmodel.ts`
    });
  });

  it("interactWithHistory() must be executable.", (done) => {
    const result = jsModelProcess.interactWithHistory("あいうえお");

    expect(result.text).toBe("あいうえお");

    done();
  }, 3000);
});