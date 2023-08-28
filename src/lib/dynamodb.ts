const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const defaultConfig = {
  region: 'eu-west-1',
};

function createClient(config) {
  const clientConfig = Object.assign({}, defaultConfig, config);
  return new DynamoDBClient(clientConfig);
}

module.exports = {
  createClient,
};
