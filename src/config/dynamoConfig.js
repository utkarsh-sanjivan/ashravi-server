const tableName = process.env.DYNAMO_TABLE_NAME || process.env.PARENTS_TABLE_NAME;

module.exports = { tableName };
