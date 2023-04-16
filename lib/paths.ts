let pythonPath: string;

if (process.platform == "win32") {
  pythonPath = `${__dirname}/../runtimes/venv/Scripts/python.exe`;
} else {
  pythonPath = `${__dirname}/../runtimes/venv/bin/python3`;
}

export default {
  queueFile: `${__dirname}/../assets/queue.json`,
  indexPy: `${__dirname}/../python/index.py`,
  pythonPath,
  pythonCwd: `${__dirname}/../python`,
  thinkerAIConfig: `${__dirname}/../taconfig.json`
}