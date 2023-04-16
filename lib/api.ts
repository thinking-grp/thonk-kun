import * as dotenv from "dotenv";
dotenv.config();

import request from "request";
import global from "./global";
import { ModelConfig } from "./model";

/** 
 * Generates a reply from input text and information from previous conversations.
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
 * 
 * @param { string } text A string to input into the AI.
 * @param { ?string[] } history Array of previous conversations. If not specified, the array will be empty.
 * @returns { Promise<{ reply?: string; history?: string[]; }> } The result of optimizing the information received from the API. If no information is available from the API, an empty result will be returned.
 */
export function interactWithHistory(text: string, history?: string[]): Promise<{ reply?: string; history?: string[]; }> {
  if (!history) history = [];

  return new Promise((resolve, reject) => {
    request({
      url: "http://127.0.0.1:20231/api/v1/interact",
      method: "POST",
      json: {
        text,
        history: []
      },
      headers: {
        "Content-type": "application/json",
      }
    }, (error, res, body) => {
      if (error) {
        console.error(error);

        resolve({ reply: undefined, history: undefined });

        return;
      }

      if (res.statusCode !== 200) {
        resolve({ reply: undefined, history: undefined })
      }

      resolve(body);
    });
  });
}

/**
 * @deprecated This function will be removed in the stable version.
 * 
 * This function fine-tunes the model.
 * **It will be migrated to `fineTune()` in the future.**
 * 
 * @param training_file_path - File path used for training
 * @param model_output_dir - Path of the directory to output the model
 */
export function fineTuning(training_file_path: string, model_output_dir: string, model_name_or_path?: string): Promise<{ reply?: string; history?: string[]; }> {
  if (!model_name_or_path) model_name_or_path = "rinna/japanese-gpt2-medium";

  return new Promise((resolve, reject) => {
    const url = encodeURI(`http://localhost:20231/api/v1/finetuning/chat_model`);
    request({
      url,
      method: "POST",
      json: {
        training_file_path,
        model_output_dir,
        model_name_or_path
      },
      headers: {
        "Content-type": "application/json",
      },
    }, (error) => {
      if (error) {
        throw new Error(error);
      }
    });
  });
}

export type FineTuneOptions = {
  /**
   * Specifies the model to fine-tune.
   */
  model: ModelConfig;

  /**
   * Specifies the absolute path of the training file.
   */
  trainingFilePath: string;

  /**
   * Specifies the absolute path to output the fine-tuned model.
   */
  modelOutputDir?: string;

  /**
   * Specifies the absolute path of the evaluation file.
   * 
   * #### This option is optional but may be required depending on the model you are fine-tuning. 
   */
  evalFilePath?: string;
};

/**
 * This function fine-tunes the model.
 * 
 * @returns { any } JSON will be returned.
 */
export function fineTune(options: FineTuneOptions): any {
  if (options.model.canTrain === false) {
    throw new Error("This model is not trainable.");
  }

  const defaultOutputDir = (new URL(`${__dirname}/../assets/model_outputs/${options.model.modelType}/${options.model.modelName}`)).toString();

  if (options.model.modelType === "Chat") {
    return new Promise((resolve, reject) => {
      request({
        url: `http://127.0.0.1:20231/api/v1/fineTune/Chat`,
        method: "POST",
        json: {
          training_file_path: options.trainingFilePath,
          model_output_dir: options.modelOutputDir || defaultOutputDir,
          model_name_or_path: options.model.importPath
        },
        headers: {
          "Content-type": "application/json",
        },
        timeout: 120000
      }, (error, res, body) => {
        if (error) {
          console.error(error);

          resolve(error);

          return;
        }

        resolve(body);
      });
    });
  } else if (options.model.modelType === "TextClassification") {
    if (!options.evalFilePath) throw new Error("evalFilePath is not defined.");

    return new Promise((resolve, reject) => {
      request({
        url: `http://127.0.0.1:20231/api/v1/fineTune/TextClassification`,
        method: "POST",
        json: {
          training_file_path: options.trainingFilePath,
          model_output_dir: options.modelOutputDir || defaultOutputDir,
          model_name_or_path: options.model.importPath,
          eval_file_path: options.evalFilePath
        },
        headers: {
          "Content-type": "application/json",
        },
        timeout: 120000
      }, (error, res, body) => {
        if (error) {
          console.error(error);

          resolve(error);

          return;
        }

        resolve(body);
      });
    });
  }
}