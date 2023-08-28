const Runner = require('./runner');
const dynamoDB = require('./lib/dynamodb');
const { logger } = require('./lib/logger');
const backup = require('./lib/backup');

const taskMap = {
  create: 'createBackup',
  verify: 'verifyBackup',
  clean: 'cleanBackups',
};

function getTask(event) {
  const funcName = taskMap[event.task];

  if (!funcName) {
    throw new Error(`Task '${event.task}' not found.`);
  }

  return backup[funcName];
}

function createTaskContext() {
  return {
    dynamoDB: {
      client: dynamoDB.createClient(),
    },
  };
}

async function handler(event) {
  const runner = new Runner(event);

  if (!event.tasks || event.tasks.length === 0) {
    event.done = true;
    return event;
  }

  const taskContext = createTaskContext();

  logger.info('Task derived', runner);

  try {
    const taskFunc = getTask(runner);
    await taskFunc(runner, taskContext);
  } catch (err) {
    logger.error(
      `An error occurred while attempting to perform '${runner.task}' task`
    );
    throw err;
  }

  return runner.toJSON();
}

module.exports = {
  handler,
};

export {};
