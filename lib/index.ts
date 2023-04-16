/** 
 * @module thinkerAI
 * 
 * The main module of thinkerAI.
 */


/* 環境設定の読み込み */
import * as dotenv from "dotenv";
dotenv.config();

/* 定期実行用 */
import * as schedule from "node-schedule";

/* その他のモジュール */
import * as queue from "./queue";
import * as api from "./api";
import { ModelConfig, Models, createCustomModel } from "./model";
import { PythonProcess } from "./pythonProcess";
import { JSModelProcess } from "./JSModelProcess";


export {
  Models,
  ModelConfig,
  createCustomModel,

  /**
   * An object that controls the Python process API.
   */
  api,

  /**
   * @deprecated This module will be removed in 2.0.0.
   * 
   * This module handles queue management.
   */
  queue,

  PythonProcess,
  
  JSModelProcess
};

process.on("SIGINT", () => process.exit(0));