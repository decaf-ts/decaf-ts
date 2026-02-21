const path = require("node:path");

require(path.join(__dirname, "WorkerThreadTask.cjs"));
require(path.join(__dirname, "../../lib/tasks/workers/workerThread.cjs"));
