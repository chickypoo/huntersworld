const mysql = require(`promise-mysql`);
const settings = require(`../settings.json`);

module.exports.dbConnect = () => {
  return mysql.createConnection({
    host: settings.host,
    user: settings.user,
    password: settings.password,
    database: settings.database
  });
}

