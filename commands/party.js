const sql = require(`../method/mysql.js`);
const Discord = require(`discord.js`);
const settings = require(`../settings.json`);

/* Commands to test
 * Party
 * Party ?
 * Party Add @Valid
 * Party Add @NotValid
 * Party Kick @Valid
 * Party Kick @NotValid
 * Party Create with party
 * Party Create without party
 * Party Leave with party
 * Party Leave without party
 * Party Promote @Valid nonparty
 * Party Promote @Valid party
 * Party Promote @NonValid
 * Party Demote @Valid nonparty
 * Party Demote @Valid party
 * Party Demote @NonValid
 * Party Transfer @Valid nonparty
 * Party Transfer @Valid party
 * Party Transfer @NonValid
 * Party Recruit with party
 * Party Recruit without party
 * Party Join @Valid party
 * Party Join @Valid nonparty
 * Party Join @NonValid
 * Party Gibberih
 * 
 * Commands to Make
 * Add
 * Kick
 * Leave
 * Promote
 * Demote
 * Transfer
 * Join
 */
module.exports.help = {
  "name" : "party"
}

module.exports.run = async(bot, msg, arg) => {
  let id = msg.author.id, db, skip, partyId, partyInfos, recruitees, invitees;

  sql.dbConnect().then(connection => {
    db = connection;
    return db.query(`SELECT * FROM profile WHERE id = '${id}'`);
  }).then(result => {
    if(!result[0]){
      skip = true;
      return;
    }
    //Checks if player is currently in a party. Grab main party ID
    return db.query(`SELECT party_id FROM party WHERE member_id = '${id}'`);
  }).then(result => {
    if(skip) return;
    if(result[0]){
      partyId = result[0].party_id;
    }
    //Grab all party member informations with the main party ID
    //Returns NULL if player not in party.
    return db.query(`SELECT profile.rank, profile.sp_used AS sp, profile.guild, profile.id, party.role, profile.skill FROM profile JOIN party ON profile.id = party.member_id WHERE party.party_id = '${partyId}'`);
  }).then(result => {
    if(skip) return;
    if(result[0]){
      partyInfos = result;
    }
    //Grab all recruitment to the main party ID
    return db.query(`SELECT i.i_from AS id, p.rank, p.sp_used AS sp, p.skill FROM invitation i JOIN profile p ON i.i_from = p.id WHERE i.type = 'party' AND i.created > TIMESTAMPADD(DAY, -7, CURRENT_TIMESTAMP()) AND i.i_to = '${partyId}'`);
  }).then(result => {
    if(skip) return;
    if(result[0]){
      recruitees = result;
    }
    return;
  }).then(() => {
    if(skip) return;
    //Argument selecion Empty, Create, Add, Kick, Join, Recruit, Promote, Demote, Leave, Transfer and Info here
    if(arg.length === 0){
      //Empty section. Display current party informations
      if(partyInfos){
        //Display all party member's by ID and Role with description of rank, SP, guild
        msg.reply(partyListEmbed(partyInfos, id));
        return;
      } else{
        //Player not in active party
        msg.reply(`You are not in any party.`);
        return;
      }
    } else if(arg.length === 1){
      //Create / Recruit / Leave / Info
      switch(arg[0].toLowerCase()){
        case 'create' :
          if(!partyInfos){
            //No current party. Able to create a new party
            msg.reply(`You have created a new party!`);
            return db.query(`INSERT INTO party (party_id, member_id, role) VALUES ('${id}', '${id}', 'Leader')`);
          } else {
            //Player is in a party, unable to create
            msg.reply(`You are already in a party. Unable to create a new one.`);
            return;
          }
        case 'recruit' :
          //All members can view the recruitment list if in a party
          if(recruitees && partyId){
            //Display all valid candidates in a chart form
            msg.reply(recruitListChart(recruitees));
            return;
          } else if(partyId){
            //No current candidate
            msg.reply(`There are no players in the recruitment list.`);
            return;
          } else {
            //Not in party
            msg.reply(`You are not in any party.`);
            return;
          }
        case 'leave' :
        case '?' :
      }
    } else if(arg.length === 2){
      //Add / Kick / Join / Promote / Demote / Transfer
    }
    return;
  }).catch(err => {
    if(db && db.end) db.end();
    console.log(err);
  });
}
/* This construct a codeblock chart that displays recruitees' ID, skill point level, and rank
 * This is used by <>PARTY RECRUIT
 */
const recruitListChart = (infos) => {
  let message = '```CSS\n';
  let maxId = 0, maxSp = 2, maxRank = 4;
  //Find the maximum length of all IDs, SPs and ranks
  for(let i = 0; i < infos.length; i++){
    if(infos[i].id.length > maxId)
      maxId = infos[i].id.length;
    if((infos[i].sp).toString().length > maxSp)
      maxSp = (infos[i].sp).toString().length;
    if((infos[i].rank).toString().length > maxRank)
      maxRank = (infos[i].rank).toString().length;
  }
  //Start making the chart
  message += `+${`-`.repeat(maxId + 2)}+${`-`.repeat(maxRank + 2)}+${`-`.repeat(maxSp + 2)}+\n`;
  message += `| ${`Player ID`.padEnd(maxId, ` `)} | ${`Rank`.padEnd(maxRank, ` `)} | ${`SP`.padEnd(maxSp, ` `)} |\n`;
  message += `+${`-`.repeat(maxId + 2)}+${`-`.repeat(maxRank + 2)}+${`-`.repeat(maxSp + 2)}+\n`;
  for(let i = 0; i < infos.length; i++){
    message += `| ${infos[i].id.padEnd(maxId, ` `)} | ${(infos[i].rank).toString().padEnd(maxRank, ` `)} | ${(infos[i].sp).toString().padEnd(maxSp, ` `)} |\n`;
  }
  message += `+${`-`.repeat(maxId + 2)}+${`-`.repeat(maxRank + 2)}+${`-`.repeat(maxSp + 2)}+\n`;
  message += '```';
  //End of making chart
  return message;
}
/* This construct an embed that shows all party members with their infos, rank and SP power
 * This is used by  <>PARTY
 */
const partyListEmbed = (infos, pid) => {
  let memberSubInfo, memberMainInfo;
  const embed = new Discord.MessageEmbed()
    .setTitle(`Party Members`)
    .setColor([102, 153, 255])
    .setTimestamp();
  
  for(let i = 0; i < infos.length; i++){
    memberMainInfo = `Member #${i+1} : ${infos[i].id} [${infos[i].role}]${(pid == infos[i].id ? ` (YOU)` : ``)}`;
    memberSubInfo = `Adventure Rank : ${infos[i].rank}\nSkill Points Used: ${infos[i].sp}`;
    embed.addField(memberMainInfo, memberSubInfo);
  }

  return embed;
}
/* This construct an embed that shows all available command for the [Party].
 * This is used by <>PARTY ?
 */
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