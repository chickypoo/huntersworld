const sql = require(`../method/mysql.js`);
const Discord = require(`discord.js`);

module.exports.help = {
  "name" : "join"
}

module.exports.run = async(bot, msg, arg) {
  let id = msg.author.id, db;

  sql.dbConnect().then(connection => {
    db = connection;
    return db.query(`SELECT id FROM profile WHERE id = '${id}'`);
  }).then(result => {
    if(!result[0]){
      //Register the player into the system.
      msg.reply(`You have joined.`);
      return db.query(`INSERT INTO profile (id) VALUES ('${id}')`);
    } else {
      //Player is already registered in the system.
      msg.reply(`You have joined already.`);
    }
  }).then(() => {
    return db.end();
  }).catch(err => {
    if(db && db.end) db.end();
    console.log(err);
  });
}