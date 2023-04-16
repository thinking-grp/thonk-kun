import { Models, PythonProcess } from "../lib";
import { PythonProcessEvent } from "../lib/pythonProcess";

describe("PythonProcess", () => {
  let pythonProcess: PythonProcess;

  beforeEach(() => {
    pythonProcess = new PythonProcess({
      chatModels: [
        Models.Chat.GPT2ja
      ],
      mode: "mock",
      runningTime: 10000
    });
  });

  it("should emit a 'pythonStarted' event when the Python process starts", (done) => {
    pythonProcess.once("pythonStarted", () => {
      // Assert that the 'pythonStarted' event was emitted
      expect(true).toBe(true); // Replace this with your actual assertion
      done();
    });
  }, 3000);

  it("should emit a 'beforePythonQuit' event before the Python process exits", (done) => {
    let pythonQuited = false;
    pythonProcess.once("beforePythonQuit", (event) => {
      event.cancel();
    });

    pythonProcess.once("pythonQuited", () => {
      pythonQuited = true;
    });

    pythonProcess.quit();

    expect(pythonQuited).toBe(false);
    done();
  });

  it("should emit a 'pythonQuited' event when the Python process quits", (done) => {
    // 最初にon()しよう
    pythonProcess.once("pythonQuited", () => {
      // Assert that the 'pythonQuited' event was emitted
      expect(true).toBe(true); // Replace this with your actual assertion
      done();
    });

    pythonProcess.quit();
  }, 3000);

  it("should the listener be deleted with removeListener", (done) => {
    pythonProcess = new PythonProcess({
      chatModels: [
        Models.Chat.GPT2ja
      ],
      mode: "mock",
      runningTime: 10000
    });

    let isCanceled = false;
    function beforeQuit(event: PythonProcessEvent) {
      event.cancel();
      isCanceled = true;
    }

    pythonProcess.on("beforePythonQuit", beforeQuit);
    pythonProcess.removeListener("beforePythonQuit", beforeQuit);

    pythonProcess.quit();

    expect(isCanceled).toBe(false);
    done();
  }, 10000);
});