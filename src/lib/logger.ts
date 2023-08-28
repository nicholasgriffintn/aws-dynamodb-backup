const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

function checkLogLevel(level) {
  if (level === 'baselime') {
    return true;
  }
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

  return levels.indexOf(level.toUpperCase()) >= levels.indexOf(LOG_LEVEL);
}

function log(level, message, data) {
  if (!checkLogLevel(level)) return;
  const logMsg = {
    message,
    data,
    level,
  };

  try {
    console[level](JSON.stringify(logMsg));
  } catch (err) {
    if (err.message.includes('is not a function')) {
      console.error(`level ${level} is not a function`);
    }
    console.error(err);
  }
}

function info(message, data) {
  log('info', message, data);
}

function debug(message, data) {
  log('debug', message, data);
}

function returnFormattedError(data, err) {
  if (!err) {
    return data;
  }

  return {
    ...(data || {}),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  };
}

function warn(message, dataOrError, error) {
  const data =
    !error && dataOrError instanceof Error
      ? returnFormattedError({}, dataOrError)
      : returnFormattedError(dataOrError, error);
  log('warn', message, data);
}

function error(message, dataOrError, error) {
  const data =
    !error && dataOrError instanceof Error
      ? returnFormattedError({}, dataOrError)
      : returnFormattedError(dataOrError, error);
  log('error', message, data);
}

const logger = {
  info,
  debug,
  warn,
  error,
};

module.exports = {
  logger,
};
