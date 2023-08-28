const { CreateBackupCommand } = require('@aws-sdk/client-dynamodb');

const logger = require('../lib/logger');

async function requestBackup(client, tableName, backupName) {
  try {
    return await client.send(
      new CreateBackupCommand({
        TableName: tableName,
        BackupName: backupName,
      })
    );
  } catch (err) {
    throw err;
  }
}

function generateBackupName(task, tableName) {
  const prefix = task.backupPrefix;
  const dateStr = toDateTimeString(new Date());

  return `${prefix}_${dateStr}_${tableName}`;
}

function toDateTimeString(date) {
  return date
    .toISOString()
    .replace(/\:/g, '-')
    .replace(/\./g, '-')
    .toLowerCase();
}

module.exports = async function createBackup(task, context) {
  const dynamoDBClient = context.dynamoDB.client;

  logger.info('Starting to request DynamoDB backups');

  for (let tableName of task.backupTables) {
    const backupName = generateBackupName(task, tableName);

    logger.info(`Requesting table backup for '${tableName}'`);

    const backup = await requestBackup(dynamoDBClient, tableName, backupName);
    task.backupArns.add(backup.BackupDetails.BackupArn);

    logger.info(`Table backup request completed for '${tableName}'`);
  }

  task.shouldWait = true;
};

export {};
