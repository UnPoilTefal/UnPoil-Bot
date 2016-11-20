const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log('Ready!');
});

client.on('message', message => {
  if (message.content === '!ping') {
    message.reply('pong');
  }
});

client.on('message', message => {
  if (message.content.startsWith("!wow")) {
    var commande = message.content;
    var cmdtab = commande.split(" ");
    if(cmdtab.length == 2) {
      var userwow = cmdtab[1];
      var userwowtab = userwow.split("-")
      if(userwowtab.length == 2) {
        var url = "http://eu.battle.net/wow/fr/character/" + encodeURIComponent(userwowtab[1]) + "/" + encodeURIComponent(userwowtab[0]) + "/advanced";
        message.reply("Demande d'info sur le personnage " + userwowtab[0] + " du serveur " + userwowtab[1] + "\n" + url);
      } else {
        message.reply("Le format de la commande doit être !wow personnage-serveur");
      }

    }

  }
});

client.login('MjQ4MzY1NjM0ODE4MTQ2MzA1.Cw3NSw.YAOsoPjgtphKyz78EzfQh1dTVV4');

process.on( 'SIGINT', function () {
  client.destroy();
});
