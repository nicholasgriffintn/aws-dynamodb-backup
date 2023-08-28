const { ListBackupsCommand } = require('@aws-sdk/client-dynamodb');

const logger = require('../lib/logger');

async function fetchBackupsList(dynamoDBClient) {
  try {
    const response = await dynamoDBClient.send(
      new ListBackupsCommand({ BackupType: 'USER' })
    );
    return response.BackupSummaries || [];
  } catch (err) {
    throw err;
  }
}

function getBackupsInProgress(listedBackups, newBackupARNs) {
  const backupARNs = new Set(newBackupARNs);

  listedBackups
    .filter(forAvailableBackups(backupARNs))
    .forEach(deleteAvailableBackups(backupARNs));

  return Array.from(backupARNs);
}

function forAvailableBackups(backupARNs) {
  return (backup) => {
    return (
      backupARNs.has(backup.BackupArn) && backup.BackupStatus === 'AVAILABLE'
    );
  };
}

function deleteAvailableBackups(backupARNs) {
  return (backup) => {
    backupARNs.delete(backup.BackupArn);
    logger.info(`Backup ${backup.BackupArn} is available`);
  };
}

module.exports = async function verifyBackupAvailable(task, context) {
  const dynamoDBClient = context.dynamoDB.client;
  const backupARNs = task.backupArns;

  const listedBackups = await fetchBackupsList(dynamoDBClient);
  task.backupArns = getBackupsInProgress(listedBackups, backupARNs);

  if (task.backupArns.length > 0) {
    task.shouldWait = true;
  }
};

export {};
