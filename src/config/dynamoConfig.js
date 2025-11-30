// Default to staging table for local runs so the server connects to shared staging data
const DEFAULT_TABLE_NAME = 'asharvi-dynamo-staging';
const tableName = process.env.DYNAMO_TABLE_NAME || process.env.PARENTS_TABLE_NAME || DEFAULT_TABLE_NAME;

module.exports = { tableName, DEFAULT_TABLE_NAME };
