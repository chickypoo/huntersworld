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
  let id = msg.author.id, db, skip, partyId, partyInfos, recruitees, invitees, role, targetId, route;

  sql.dbConnect().then(connection => {
    db = connection;
    return db.query(`SELECT * FROM profile WHERE id = '${id}'`);
  }).then(result => {
    if(!result[0]){
      skip = true;
      return;
    }
    //Checks if player is currently in a party. Grab main party ID
    return db.query(`SELECT party_id, role FROM party WHERE member_id = '${id}'`);
  }).then(result => {
    if(skip) return;
    if(result[0]){
      partyId = result[0].party_id;
      role = result[0].role;
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
        return skip = true;
      } else{
        //Player not in active party
        msg.reply(`You are not in any party.`);
        return skip = true;
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
            return skip = true;
          }
        case 'recruit' :
          //All members can view the recruitment list if in a party
          if(recruitees && partyId){
            //Display all valid candidates in a chart form
            msg.reply(recruitListChart(recruitees));
            return skip = true;
          } else if(partyId){
            //No current candidate
            msg.reply(`There are no players in the recruitment list.`);
            return skip = true;
          } else {
            //Not in party
            msg.reply(`You are not in any party.`);
            return skip = true;
          }
        case 'leave' :
          //Player can only leave party if currently in party
          //If player is the leader of the party, it will be transfered to random elite then recruit
          //Party ID is then changed to the new leader, changing all invitation party ID to the new one
        case '?' :
          //Display party help view
          msg.reply(descEmbed);
          return skip = true;
      }
    } else if(arg.length === 2){
      //Add / Kick / Join / Promote / Demote / Transfer
      switch(arg[0].toLowerCase()){
        case 'add' :
          //Leader and Elite can add (send invites) to other player to join party
          //If the receipient has invitation matching to the party ID, it auto joins the party
          //Can only add if the party is not full
        case 'kick' :
          //Leader and Elite can kick other player with lower role power from the party
          //Player cannot kick themself from the party, use the leave command instead
        case 'promote' :
        case 'demote' :
          //Leader and Elite can promote other members of party up to Elite or demote other members of party down to Recruit with lesser priority.
          //Leader cannot be promoted / demoted
          //Can only promote up to role before and can only demote from role before
          if(partyId && (role == `Leader` || role == `Elite`)){
            //Determine the tag to see if valid player and ID
            targetId = isIdValid(arg[1]);
            if(!targetId){
              //Bad argument
              msg.reply(`You have entered a bad ID. Valid ID is either by Tag like <@${id}> or ${id}.`);
            } else {
              //Send query to check if the target player is in system and not in party
              if(arg[0].toLowerCase() == `add`)
                route = `PARTY ADD`;
              else if(arg[0].toLowerCase() == `kick`)
                route = `PARTY KICK`;
              else if(arg[0].toLowerCase() == `promote`)
                route = `PARTY PROMOTE`; 
              else
                route = `PARTY DEMOTE`;
              return db.query(`SELECT role FROM party WHERE member_id = '${targetId}' AND party_id = '${partyId}'`);
            }
          } else if(partyId){
            //Not enough power (Player is a Recruit or Trusted)
            msg.reply(`You do not have enough power to do that (Only Leader and Elite can ${arg[0].toLowerCase()} other member).`);
          } else {
            //Not in party
            msg.reply(`You are not in any party.`);
          }
          return skip = true;
        case 'transfer' :
          //Only Leader can transfer leadship of party to other member of party
          //The leader is then repositioned as Elite
          if(partyId && role == `Leader` && (id !== isIdValid(arg[1]))){
            //Determine the tag to see if valid player and ID
            targetId = isIdValid(arg[1]);
            if(!targetId){
              //Bad argument
              msg.reply(`You have entered a bad ID. Valid ID is either by Tag like <@${id}> or ${id}.`);
            } else {
              route = `PARTY TRANSFER`;
              return db.query(`SELECT role FROM party WHERE member_id = '${targetId}' AND party_id = '${id}'`);
            }
          } else if(partyId && role == `Leader`){
            //Leader is trying to transfer leadship back to self
            msg.reply(`You are trying to transfer the party leadership back to yourself.`);
          }else if(partyId){
            //Player is not the leader of party
            msg.reply(`You are not the leader of this party.`);
          } else {
            //Not in party
            msg.reply(`You are not in any party.`);
          }
          return skip = true;
        case 'join' :
          //Only nonparty member can apply for a party
          //Auto joins the party if party has live invitation to player
          if(!partyId){
            //Player is not in party and is able to apply and the ID given is valid
            //Find the owner of the party and sends it to them
            targetId = isIdValid(arg[1]);
            if(!targetId){
              //Bad argument
              msg.reply(`You have entered a bad ID. Valid ID is either by Tag like <@${id}> or ${id}.`);
            } else {
              //Look for the party ID of the target's party
              return db.query(`SELECT party_id FROM party WHERE member_id = '${targetId}' OR party_id = '${targetId}'`);
            }
          } else {
            //Player is in a party, unable to send application
            msg.reply(`You are in an active party. Unable to send party application.`);
          }
          return skip = true;
      }
    }
    return;
  }).catch(err => {
    if(db && db.end) db.end();
    console.log(err);
  });
}

/* This checks if the argument passed is a valid ID
 * ID is in snowflake 64-bit, represented in numeric format as string
 * Returns string of numbers if valid, NULL else
 */
const isIdValid(testId){
  //Valid case are: "123456789" or "<@!123456789>", returns "123456789"
  if(!isNaN(testId)){
    //Case 1 : "123456789"
    return testId;
  } else if(testId.startsWith(`<@`) && testId.endsWith(`>`)){
    //Case 2 : "<@!123456789>"
    let iStart = testId.indexOf(testId.match(/[0-9]/g).shift());
    let iEnd = testId.lastIndexOf(testId.match(/[0-9]/g).pop());
    if(!isNaN(testId.substring(iStart, iEnd + 1)))
      return testId.substring(iStart, iEnd + 1);
  }
  return null;
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
const descEmbed = () => {
  const embed = new Discord.MessageEmbed()
    .setTitle(`Party Description`)
    .setColor([102, 153, 255])
    .setDescription(`Party allows multiple players to partake in hunting and bossing.\nMaximum party members allowed is 10.`)
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