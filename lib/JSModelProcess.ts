
import EventEmitter from "node:events";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type JSModelProcessOptions = {
  modelPath: string

  /**
   * @experimental Experimental feature from 1.0.0 α3
   * 
   * Specifies the type of the PythonProcess class.
   * 
   * `normal` is the mode that launches the actual Python process. (This is the default value.)
   *
   * `mock` is the mode used when testing with Jest etc. Use a class with the same interface as the Python process instead of the actual Python process.
   */
  mode?: JSModelProcessType

  /**
   * Run time, milliseconds (default is 20000 milliseconds)
   *
   * Only works in **`mock` mode**.
   */
  runningTime?: number
};

export type JSModelProcessType = "normal" | "mock";

export type JSModelProcessEventMap = {
  "processStarted": () => void,
  "sendToChild": (data: any) => void
}

interface JSModel {
  start?: () => {};
  interactWithHistory: (text: string, history: string[]) => {
    text: string;
    history: string[];
  };
  interact: (text: string) => string;
  train: (trainingData: any) => void;
}

/**
 * @experimental
 */
export class JSModelProcess {
  private event: EventEmitter;
  private mode: JSModelProcessType;
  private modelPath: string;
  private model: JSModel;

  /**
   * Add a listener for the event.
   * 
   * @param event - The name of the event to listen for.
   * @param listener - The function to call when the event is emitted.
   */
  on: <K extends keyof JSModelProcessEventMap>(event: K, listener: JSModelProcessEventMap[K]) => any;

  /**
   * Add a listener for the **one-time** event.
   * 
   * @param event - The name of the event to listen for.
   * @param listener - The function to call when the event is emitted.
   */
  once: <K extends keyof JSModelProcessEventMap>(event: K, listener: JSModelProcessEventMap[K]) => any;
  
  /**
   * Remove a listener for the event.
   */
  removeListener: <K extends keyof JSModelProcessEventMap>(event: K, listener: JSModelProcessEventMap[K]) => void;

  /**
   * @param { JSModelProcessOptions } options
   */
  constructor(options: JSModelProcessOptions) {
    this.mode = options.mode || "normal";
    this.modelPath = options.modelPath;

    this.model = require(this.modelPath);

    this.event = new EventEmitter();

    this.on = function <K extends keyof JSModelProcessEventMap>(
      eventName: K,
      listener: JSModelProcessEventMap[K]
    ): void {
      this.event.on(eventName, listener);
    }

    this.once = function <K extends keyof JSModelProcessEventMap>(
      eventName: K,
      listener: JSModelProcessEventMap[K]
    ): void {
      this.event.once(eventName, listener);
    }

    this.removeListener = function <K extends keyof JSModelProcessEventMap>(
      eventName: K,
      listener: JSModelProcessEventMap[K]
    ): void {
      this.event.removeListener(eventName, listener);
    }
  }
  
  interactWithHistory (text: string, history?: string[]): {
    text: string;
    history: string[];
  } {
    if (!history) history = [];

    return this.model.interactWithHistory(text, history);
  }
  
  train (trainingData: any) {
    this.model.train(trainingData);
  }
  
  interact (text: string, history?: string[]): string {
    if (!history) history = [];

    return this.model.interact(text);
  }
}