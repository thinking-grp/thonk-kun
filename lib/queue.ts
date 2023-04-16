import * as fs from "node:fs";
import paths from "./paths";

export type Queue = {
  type: string;
  data: any;
  addedDate: Date
  editedDate?: Date
}

export type Queues = {
  queues: Queue[]
}

export let queue: Queues;

export function addQueue(type: string, data: any): number {
  queue.queues[queue.queues.length] = {
    type,
    data,
    addedDate: new Date()
  }

  saveQueue();

  return queue.queues.length - 1;
}

export function saveQueue() {
  fs.writeFileSync(paths.queueFile, JSON.stringify(queue, null, "\t"));
}

export function loadQueue() {
  let queuePlainText: string = fs.readFileSync(paths.queueFile, { encoding: "utf-8" });

  try {
    queue = JSON.parse(queuePlainText);
  } catch (e) {

  }
}

loadQueue();