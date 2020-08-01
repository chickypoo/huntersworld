const Discord = require(`discord.js`);
const fs = require(`fs`);

const botSetting = require(`./settings.json`);

const client = new Discord.Client();

client.commands = new Discord.Collection();

const actioned = new Set();

fs.readdir(`./commands/`, (err, files) => {
  if(err) console.log(err);

  let jsfile = files.filter(f => f.split(`.`).pop() === `js`)
  if(jsfile.length <= 0){
    console.log(`No commands found.`);
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    client.commands.set(props.help.name, props);
  });
})

client.once(`ready`, () => {
  console.log(`Hunter's World is online!`);
});

client.on(`message`, message => {
  if(!message.content.startsWith(botSetting.prefix) || message.author.bot) return;

  let messageArray = message.content.split(` `);
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  let commandFile = client.commands.get(cmd.slice(botSetting.prefix.length));
  if(actioned.has(message.author.id)){
    message.reply(`There is a 2 seconds global cooldown for commands.`);
    return;
  } else {
    actioned.add(message.author.id);
    setTimeout(() => {
      actioned.delete(message.author.id);
    }, 2000);
  }

  if(commandFile){
    console.log(`${message.author.id} --> ${message.content}`);
    commandFile.run(client, message, args);
  }
});

client.login(botSetting.token);