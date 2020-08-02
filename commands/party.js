const sql = require(`../method/mysql.js`);
const Discord = require(`discord.js`);
const settings = require(`../settings.json`);

module.exports.help = {
  "name" : "party"
}

module.exports.run = async(bot, msg, arg) => {
  let id = msg.author.id, db, skip;

  sql.dbConnect().then(connection => {
    db = connection;
    return db.query(`SELECT * FROM profile WHERE id = '${id}'`);
  }).then(result => {
    if(!result[0]){
      skip = true;
      return;
    }
    //Argument selecion Empty, Create, Add, Kick, Join, Recruit, Promote, Demote, Leave, Transfer
    if(arg.length === 1 && arg[0] == `?`){
      //This is the Empty section. Sends in the embed description of the party.
      msg.reply(desc());
      skip = true;
      return;
    }

    return;
  }).then(() => {
    return db.end();
  }).catch(err => {
    if(db && db.end) db.end();
    console.log(err);
  });
}

const desc = () => {
  const embed = new Discord.MessageEmbed()
    .setTitle(`Party Description`)
    .setColor([102, 153, 255])
    .setDescription(`Party allows multiple players to partake in hunting and bossing.\nMaximum party members allowed is 5.`)
    .setTimestamp()
    .addField(`Default`, `Usage: ${settings.prefix}party\nThis shows your current party, roles and total skill point used.`)
    .addField(`Create`, `Usage: ${settings.prefix}party create\nThis creates a party with you as leader.`)
    .addField(`Add`, `Usage: ${settings.prefix}party add <@Discord User>\nThis sends an invitation to the user. Available for Leader and Elite. Auto-invite if join exists. Last 7 days.`)
    .addField(`Kick`, `Usage: ${settings.prefix}party kick <@Discord User>\nThis removes the member from the party. Available for Leader and Elite.`)
    .addField(`Join`, `Usage: ${settings.prefix}party join <@Discord User>\nThis request the party to join. Auto-join if invitation exists. This notice last 7 days.`)
    .addField(`Recruit`, `Usage: ${settings.prefix}party recruit\nThis shows any pending join notice to the party.`)
    .addField(`Promote`, `Usage: ${settings.prefix}party promote <@Discord User>\nThis promotes a member up to Elite. Available for Leader and Elite.`)
    .addField(`Demote`, `Usage: ${settings.prefix}party demote <@Discord User>\nThis demotes a member down to Recruit. Available for Leader and Elite.`)
    .addField(`Leave`, `Usage: ${settings.prefix}party leave\nThis allows member to leave the party. If the member is Leader, the status is passed to random Elite then Recruit.`)
    .addField(`Transfer`, `Usage: ${settings.prefix}party transfer <@Discord User>\nThis transfer the leadership to the member and making Leader to Elite.`)
  
    return embed;
}