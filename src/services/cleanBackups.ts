const {
  ListBackupsCommand,
  DeleteBackupCommand,
} = require('@aws-sdk/client-dynamodb');

const logger = require('../lib/logger');

async function cleanBackups(task, context) {
  logger.info('DynamoDB backups clean up starting');

  const dynamoDBClient = context.dynamoDB.client;

  const backups = await fetchBackupsList(dynamoDBClient);
  logger.info(
    'DynamoDB backup list retrieved:',
    JSON.stringify(backups, null, 2)
  );

  const tables = task.backupTables;

  for (let tableName of tables) {
    const backupsToDelete = backups.filter((backup) => {
      return filterByAvailableBackups(backup, tableName);
    });

    backupsToDelete.sort((a, b) => {
      return sortDescByCreationDate(a, b);
    });

    for (let index in backupsToDelete) {
      const summary = backupsToDelete[index];

      const backupToDelete = {
        BackupArn: summary.BackupArn,
      };
      if (index >= task.backupsToKeep) {
        logger.info(
          'DynamoDB backups to delete:',
          JSON.stringify(backupToDelete, null, 2)
        );

        await dynamoDBClient.send(new DeleteBackupCommand(backupToDelete));
      }
    }
  }

  return true;
}

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

function filterByAvailableBackups(backup, tableName) {
  return backup.TableName === tableName && backup.BackupStatus === 'AVAILABLE';
}

function sortDescByCreationDate(a, b) {
  if (a.BackupCreationDateTime > b.BackupCreationDateTime) return -1;
  if (a.BackupCreationDateTime < b.BackupCreationDateTime) return 1;
  return 0;
}

module.exports = cleanBackups;

export {};
