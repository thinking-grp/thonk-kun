// -------------------------------
// モデルの定義
// -------------------------------


// 型

/**
 * The type of model that can be used in the Python process.
 */
export enum ModelType {
  Chat = "Chat",
  TextClassification = "TextClassification"
}

/**
 * An interface for model configs that can be used by the Python process.
 */
export interface ModelConfig {
  modelName: string;
  modelType: keyof typeof ModelType;
  language: string;
  version?: string;
  modelPath: string;
  importPath: string;
  canTrain: boolean;
  transformersModelPath?: string;
}

type Models = {
  readonly Chat: {
    readonly GPT2ja: ModelConfig,
    readonly SimpleCALCja: ModelConfig;
  },
  readonly TextClassification: {
    readonly BERTja: ModelConfig
  }
}


// モデル設定

const gpt2jaModelConfig: ModelConfig = {
  modelName: "GPT2ja",
  modelType: ModelType.Chat,
  language: "ja",
  modelPath: `${__dirname}/../python/models/gpt_model.py`,
  importPath: "models.gpt_model",
  canTrain: true
};

const bertjaModelConfig: ModelConfig = {
  modelName: "BERTja",
  modelType: ModelType.TextClassification,
  language: "ja",
  modelPath: `${__dirname}/../python/models/text_classification/bert_model.py`,
  importPath: "models.text_classification.bert_model",
  canTrain: true
};

const simpleCALCjaModelConfig: ModelConfig = {
  modelName: "SimpleCALCja",
  modelType: ModelType.Chat,
  language: "ja",
  modelPath: `${__dirname}/../python/models/chat/simple_calc_model.py`,
  importPath: "models.chat.simple_calc_model",
  canTrain: false
};

export type CustomModelOptions = {
  modelName?: string,
  baseModel: ModelConfig,
  transformersModelDir?: string
};


// モデル

/**
 * Create a model config for a fine-tuned model that can be used with the PythonProcess class.
 * 
 * Below is an example of generating a model config for a fine-tuned model of Chat.GPT2ja. 
 * 
 * ```ts
 * import { PythonProcess, Models, createCustomModel } from "./lib";
 * 
 * const customModel = createCustomModel({
 *   baseModel: Models.Chat.GPT2ja,
 *   transformersModelDir: "./transformers/outputs"
 * });
 * 
 * const pythonProcess = new PythonProcess({
 *   chatModels: [ customModel ]
 * });
 * ```
 */
export function createCustomModel(options: CustomModelOptions): ModelConfig {
  return {
    modelName: options.modelName || options.baseModel.modelName,
    modelType: options.baseModel.modelType,
    language: options.baseModel.language,
    modelPath: options.baseModel.modelPath,
    importPath: options.baseModel.importPath,
    canTrain: options.baseModel.canTrain,
    transformersModelPath: options.transformersModelDir || ""
  }
}

/**
 * An object containing model config that can be used by the Python process.
 * 
 * The example below shows how to specify the model to use for chatting in the PythonProcess class.
 * 
 * ```ts
 * import { PythonProcess, Models } from "./lib";
 * 
 * const pythonProcess = new PythonProcess({
 *   chatModels: [ Models.Chat.GPT2ja ]
 * });
 * ```
 */
export const Models: Models = {
  Chat: {
    GPT2ja: gpt2jaModelConfig,
    SimpleCALCja: simpleCALCjaModelConfig,
  },
  TextClassification: {
    BERTja: bertjaModelConfig
  }
}