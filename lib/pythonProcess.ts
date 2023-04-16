/* Pythonプロセス用モジュール */
import { PythonShell } from "python-shell";

/* ファイルパス */
import paths from "./paths";

/* その他のモジュール */
import { ModelConfig } from "./model";
import EventEmitter from "node:events";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* Pythonプロセス関連 */

export type PythonProcessType = "normal" | "mock";

export type PythonProcessOptions = {
  /**
   * Specifies the model to use for text classification.
   */
  textClassificationModel?: ModelConfig

  /**
   * An array of models to use for text generation.
   */
  chatModels: ModelConfig[]

  /**
   * @experimental Experimental feature from 1.0.0 α3
   * 
   * Specifies the type of the PythonProcess class.
   * 
   * `normal` is the mode that launches the actual Python process. (This is the default value.)
   *
   * `mock` is the mode used when testing with Jest etc. Use a class with the same interface as the Python process instead of the actual Python process.
   */
  mode?: PythonProcessType

  /**
   * Run time, milliseconds (default is 20000 milliseconds)
   *
   * Only works in **`mock` mode**.
   */
  runningTime?: number
};

export class PythonProcessEvent {
  private isCanceled: boolean = false;

  /**
   * Cancel the event. Cancellation may not work depending on the event.
   */
  cancel() {
    this.isCanceled = true;
  }

  isCanceledEvent() {
    return this.isCanceled;
  }
}

export type PythonProcessEventMap = {
  /**
   * Fires when the Python process starts.
   */
  "pythonStarted": () => void,

  /**
   * Fires when the Python process starts restarting with `PythonProcess.restart()`.
   */
  "pythonRestarting": () => void,

  /**
   * Fires when autostarting of Python processes is resumed.
   */
  "pythonAutoRestarted": () => void,

  /**
   * Fires when a Python process begins to exit with `PythonProcess.quit()`.
   * @param event
   */
  "beforePythonQuit": (event: PythonProcessEvent) => void,

  /**
   * Fires when PythonProcess.quit() terminates the Python process.
   * 
   * There is currently no way to detect crash termination, but **it will be added in the future**.
   */
  "pythonQuited": () => void,

  /**
   * Fired when Python process crashes.
   */
  "pythonCrashed": () => void
};

/**
 * A class that controls a Python process.
 * 
 * The example below shows how to generate text when a Python process is started.
 * 
 * ```ts
 * import { api, PythonProcess, Models } from "./lib";
 * 
 * const pythonProcess = new PythonProcess({
 *   chatModels: [ Models.Chat.GPT2ja ]
 * });
 * 
 * pythonProcess.on("pythonStarted", () => {
 *   api.interactWithHistory("That's good.", [ "Hello how are you?", "I'm fine." ]);
 * });
 * ```
 */
export class PythonProcess {
  private indexPy?: PythonShell;
  private textClassificationModel?: ModelConfig;
  private chatModels: ModelConfig[];
  private event: EventEmitter;
  private mode: PythonProcessType;

  /**
   * Add a listener for the event.
   * 
   * @param event - The name of the event to listen for.
   * @param listener - The function to call when the event is emitted.
   */
  on: <K extends keyof PythonProcessEventMap>(event: K, listener: PythonProcessEventMap[K]) => any;

  /**
   * Add a listener for the **one-time** event.
   * 
   * @param event - The name of the event to listen for.
   * @param listener - The function to call when the event is emitted.
   */
  once: <K extends keyof PythonProcessEventMap>(event: K, listener: PythonProcessEventMap[K]) => any;

  /**
   * Remove a listener for the event.
   */
  removeListener: <K extends keyof PythonProcessEventMap>(event: K, listener: PythonProcessEventMap[K]) => void;

  /**
   * Command line arguments used when starting the Python process.
   * Changes to this variable will be applied the next time the Python process is restarted.
   * 
   * Below is an example command line argument for a Python process.
   * 
   * ```js
   * PythonProcess.args = [
   *   "--classification-model",
   *   "none",
   *   "--chat-model",
   *   "models.gpt_model"
   * ]
   * ```
   */
  args: string[];

  /**
   * @param { PythonProcessOptions } options
   */
  constructor(options: PythonProcessOptions) {
    this.textClassificationModel = options.textClassificationModel;
    this.chatModels = options.chatModels;
    this.mode = options.mode || "normal";

    this.event = new EventEmitter();

    this.on = function <K extends keyof PythonProcessEventMap>(
      eventName: K,
      listener: PythonProcessEventMap[K]
    ): void {
      this.event.on(eventName, listener);
    }

    this.once = function <K extends keyof PythonProcessEventMap>(
      eventName: K,
      listener: PythonProcessEventMap[K]
    ): void {
      this.event.once(eventName, listener);
    }

    this.removeListener = function <K extends keyof PythonProcessEventMap>(
      eventName: K,
      listener: PythonProcessEventMap[K]
    ): void {
      this.event.removeListener(eventName, listener);
    }

    this.args = [
      "--classification-model",
      this.textClassificationModel ? this.textClassificationModel.importPath : "none",
      "--chat-models"
    ];

    for (const model of this.chatModels) {
      this.args[this.args.length] = `${model.importPath}${model.transformersModelPath ? `|${model.transformersModelPath}` : ""}`;
    }

    if (this.mode === "normal") {
      this.indexPy = startPython(this.args);

      this.indexPy.on("error", (error) => {
        console.error("PythonShell ERROR:", error);
      });

      this.indexPy.on("pythonError", (error) => {
        console.error(`Python ERROR: ${error}`);
      });

      this.indexPy.on("message", async (message) => {
        if (String(message).includes("Flask is started.")) {
          await sleep(3000);
          this.event.emit("pythonStarted");
        }

        console.info("Python INFO:", message);
      });


      this.indexPy.on("close", () => {
        this.event.emit("pythonCrashed");

        console.warn("WARNING: Python process is exiting.");
        this.indexPy = startPython(this.args);

        this.event.emit("pythonAutoRestarted");
      });
    } else {
      setTimeout(() => {
        this.event.emit("pythonStarted");

        setTimeout(() => {
          this.event.emit("pythonQuited");
        }, options.runningTime || 20000);
      });
    }

    process.on("exit", () => {
      if (!(this.indexPy instanceof PythonShell)) {
        console.info("INFO: Terminating mock process...");

        return;
      }

      console.info("INFO: Terminating Python process...");
      console.info("pid: ", this.indexPy.childProcess.pid);
      process.kill(Number(this.indexPy.childProcess.pid));
    });
  }

  /**
   * A function to restart the Python process.
   * 
   * The `pythonRestarting` event fires before the Python process restarts.
   */
  restart() {
    if (!(this.indexPy instanceof PythonShell)) {
      this.event.emit("pythonRestarting");
      return;
    }

    this.event.emit("pythonRestarting");
    this.indexPy.kill();
    this.indexPy = startPython(this.args);
  }

  /**
   * A function that terminates the Python process.
   * 
   * The `pythonQuited` event fires after the Python process exits.
   */
  quit() {
    const event = new PythonProcessEvent();

    this.event.emit("beforePythonQuit", event);

    if (event.isCanceledEvent()) return;

    if (!(this.indexPy instanceof PythonShell)) {
      this.event.emit("pythonQuited");
      return;
    }

    this.indexPy.kill();
    this.event.emit("pythonQuited");
  }
}

function startPython(args: string[]): PythonShell {
  console.info("INFO: Python process is starting...");

  return new PythonShell(paths.indexPy, {
    pythonPath: paths.pythonPath,
    cwd: paths.pythonCwd,
    args
  });
}