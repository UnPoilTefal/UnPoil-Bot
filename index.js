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
    console.log("!wow Request");
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

    } else {
      message.reply("Le format de la commande doit être !wow personnage-serveur");
    }

  }
});

var apiKey = process.env.apiKey;
if (isEmpty(apiKey)) {
    console.log("Variable d'environnement apiKey manquante.");
    client.destroy();
    process.exit(1);
} else {
  client.login(apiKey);
}

process.on( 'SIGINT', function () {
  console.log("SIGINT signal");
  client.destroy();
});

process.on('exit', function (){
  console.log('Goodbye!');
  client.destroy();
});

function isEmpty(value) {
  return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}
