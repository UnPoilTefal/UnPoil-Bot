const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log('Read!');
});

client.on('message', message => {
  if (message.content === '!ping') {
    message.reply('pong');
  }
});

client.login('MjQ4MzY1NjM0ODE4MTQ2MzA1.Cw3NSw.YAOsoPjgtphKyz78EzfQh1dTVV4');
