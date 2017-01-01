var fs = require('fs');

try {
	var Discord = require("discord.js");
} catch (e){
	console.log(e.stack);
	console.log(process.version);
	console.log("Please run npm install and ensure it passes with no errors!");
	process.exit();
}
console.log("Starting DiscordBot\nNode version: " + process.version + "\nDiscord.js version: " + Discord.version);

// Load custom permissions
var dangerousCommands = ["eval","pullanddeploy","setUsername"];
var Permissions = {};
try{
	Permissions = require("./permissions.json");
} catch(e){
	Permissions.global = {};
	Permissions.users = {};
}

for( var i=0; i<dangerousCommands.length;i++ ){
	var cmd = dangerousCommands[i];
	if(!Permissions.global.hasOwnProperty(cmd)){
		Permissions.global[cmd] = false;
	}
}
Permissions.checkPermission = function (user,permission){
	try {
		var allowed = true;
		try{
			if(Permissions.global.hasOwnProperty(permission)){
				allowed = Permissions.global[permission] === true;
			}
		} catch(e){}
		try{
			if(Permissions.users[user.id].hasOwnProperty(permission)){
				allowed = Permissions.users[user.id][permission] === true;
			}
		} catch(e){}
		return allowed;
	} catch(e){}
	return false;
}
fs.writeFile("./permissions.json",JSON.stringify(Permissions,null,2));

//load config data
var Config = {};
try{
	Config = require("./config.json");
} catch(e){ //no config file, use defaults
	Config.debug = false;
	Config.commandPrefix = '!';
	try{
		if(fs.lstatSync("./config.json").isFile()){
			console.log("WARNING: config.json found but we couldn't read it!\n" + e.stack);
		}
	} catch(e2){
		fs.writeFile("./config.json",JSON.stringify(Config,null,2));
	}
}
if(!Config.hasOwnProperty("commandPrefix")){
	Config.commandPrefix = '!';
}

var qs = require("querystring");

var startTime = Date.now();

function isEmpty(value) {
  return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}

var commands = {
	"aliases": {
		description: "lists all recorded aliases",
		process: function(bot, msg, suffix) {
			var text = "current aliases:\n";                                                                                     for(var a in aliases){                                                                                                       if(typeof a === 'string')
				text += a + " ";
			}
			msg.channel.sendMessage(text);
		}
},
  "ping": {
        description: "responds pong, useful for checking if bot is alive",
        process: function(bot, msg, suffix) {
            msg.channel.sendMessage( msg.author+" pong!");
            if(suffix){
                msg.channel.sendMessage( "note that !ping takes no arguments!");
            }
        }
},
"uptime": {
			usage: "",
			description: "returns the amount of time since the bot started",
			process: function(bot,msg,suffix){
				var now = Date.now();
				var msec = now - startTime;
				console.log("Uptime is " + msec + " milliseconds");
				var days = Math.floor(msec / 1000 / 60 / 60 / 24);
				msec -= days * 1000 * 60 * 60 * 24;
				var hours = Math.floor(msec / 1000 / 60 / 60);
				msec -= hours * 1000 * 60 * 60;
				var mins = Math.floor(msec / 1000 / 60);
				msec -= mins * 1000 * 60;
				var secs = Math.floor(msec / 1000);
				var timestr = "";
				if(days > 0) {
					timestr += days + " days ";
				}
				if(hours > 0) {
					timestr += hours + " hours ";
				}
				if(mins > 0) {
					timestr += mins + " minutes ";
				}
				if(secs > 0) {
					timestr += secs + " seconds ";
				}
				msg.channel.sendMessage("**Uptime**: " + timestr);
			}
    },
	"wow": {
			usage: "<personnage>-<serveur>",
			description: "Affiche le lien de l'armurerie Wow pour le personnage et le serveur indiqué",
			process: function(bot,msg,suffix) {
				console.log("!wow Request");
				var commande = msg.content;
				var cmdtab = commande.split(" ");
				if(cmdtab.length == 2) {
					var userwow = cmdtab[1];
					var userwowtab = userwow.split("-")
					if(userwowtab.length == 2) {
						var url = "http://eu.battle.net/wow/fr/character/" + encodeURIComponent(userwowtab[1]) + "/" + encodeURIComponent(userwowtab[0]) + "/advanced";
						msg.channel.sendMessage("WOW Amory pour le personnage " + userwowtab[0] + " du serveur " + userwowtab[1] + "\n" + url);
					} else {
						msg.reply("Le format de la commande doit être !wow personnage-serveur");
					}

				} else {
					msg.reply("Le format de la commande doit être !wow personnage-serveur");
				}
			}
	},
"twitch": {
		usage: "<stream>",
		description: "checks if the given stream is online",
		process: function(bot,msg,suffix){
			try {
				var request = require("request");
				request("https://api.twitch.tv/kraken/streams/"+suffix,
				function(err,res,body){
					//Check for error
					if(err){
							return console.log('Error:', err);
					}
					var stream = JSON.parse(body);
					if(stream.stream){
						msg.channel.sendMessage( suffix
							+" is online, playing "
							+stream.stream.game
							+"\n"+stream.stream.channel.status
							+"\n"+stream.stream.preview.large)
					}else{
						msg.channel.sendMessage( suffix+" is offline")
					}
				});
			} catch (e) {
				console.log("Erreur lors de la commande twitch ! " + e);
				msg.channel.sendMessage("Commande twitch indisponible pour le moment.")
			}

		}
	},
	"gif": {
		usage: "<image tags>",
        description: "returns a random gif matching the tags passed",
		process: function(bot, msg, suffix) {
		    var tags = suffix.split(" ");
		    get_gif(tags, function(id) {
			if (typeof id !== "undefined") {
			    msg.channel.sendMessage( "http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
			else {
			    msg.channel.sendMessage( "Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
		    });
		}
	},
};

function checkMessageForCommand(msg, isEdit) {
	//check if message is a command
	if(msg.author.id != bot.user.id && (msg.content[0] === Config.commandPrefix)){
        console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space
        if(msg.isMentioned(bot.user)){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+2);
			} catch(e){ //no command
				msg.channel.sendMessage("Oui ?");
				return;
			}
        }
		alias = aliases[cmdTxt];
		if(alias){
			console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
						if(suffix){
							var cmds = suffix.split(" ").filter(function(cmd){return commands[cmd]});
							var info = "";
							for(var i=0;i<cmds.length;i++) {
								var cmd = cmds[i];
								info += "**"+Config.commandPrefix + cmd+"**";
								var usage = commands[cmd].usage;
								if(usage){
									info += " " + usage;
								}
								var description = commands[cmd].description;
								if(description instanceof Function){
									description = description();
								}
								if(description){
									info += "\n\t" + description;
								}
								info += "\n"
							}
							msg.channel.sendMessage(info);
						} else {
							msg.author.sendMessage("**Available Commands:**").then(function(){
								var batch = "";
								var sortedCommands = Object.keys(commands).sort();
								for(var i in sortedCommands) {
									var cmd = sortedCommands[i];
									var info = "**"+Config.commandPrefix + cmd+"**";
									var usage = commands[cmd].usage;
									if(usage){
										info += " " + usage;
									}
									var description = commands[cmd].description;
									if(description instanceof Function){
										description = description();
									}
									if(description){
										info += "\n\t" + description;
									}
									var newBatch = batch + "\n" + info;
									if(newBatch.length > (1024 - 8)){ //limit message length
										msg.author.sendMessage(batch);
										batch = info;
									} else {
										batch = newBatch
									}
								}
								if(batch.length > 0){
									msg.author.sendMessage(batch);
								}
						});
					}
        }
		else if(cmd) {
			if(Permissions.checkPermission(msg.author,cmdTxt)){
				try{
					cmd.process(bot,msg,suffix,isEdit);
				} catch(e){
					var msgTxt = "command " + cmdTxt + " failed :(";
					if(Config.debug){
						 msgTxt += "\n" + e.stack;
					}
					msg.channel.sendMessage(msgTxt);
				}
			} else {
				msg.channel.sendMessage("You are not allowed to run " + cmdTxt + "!");
			}
		} else {
			msg.channel.sendMessage(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
		}
	} else {
		//message isn't a command or is from us
        //drop our own messages to prevent feedback loops
        if(msg.author == bot.user){
            return;
        }

        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
                msg.channel.sendMessage(msg.author + ", vous m'avez appelé ?");
        } else {

				}
    }
}

try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}
<!-- Init Bot -->
const bot = new Discord.Client();

<!-- Bot Managment -->
bot.on('ready', () => {
  console.log("Logged in! Serving in " + bot.guilds.array().length + " servers");
	console.log("type "+Config.commandPrefix+"help in Discord for a commands list.");
	bot.user.setStatus("online",Config.commandPrefix+"help");
});

bot.on("message", (msg) => checkMessageForCommand(msg, false));
bot.on("messageUpdate", (oldMessage, newMessage) => {
	checkMessageForCommand(newMessage,true);
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error

});

var discordApiKey = process.env.discordApiKey;
if (isEmpty(discordApiKey)) {
    console.log("Variable d'environnement discordApiKey manquante.");
    bot.destroy();
    process.exit(1);
} else {
  bot.login(discordApiKey);
}

var giphy_config = {
    "api_key": "dc6zaTOxFJmzC",
    "rating": "r",
    "url": "http://api.giphy.com/v1/gifs/random",
    "permission": ["NORMAL"]
};

function get_gif(tags, func) {
        //limit=1 will only return 1 gif
        var params = {
            "api_key": giphy_config.api_key,
            "rating": giphy_config.rating,
            "format": "json",
            "limit": 1
        };
        var query = qs.stringify(params);

        if (tags !== null) {
            query += "&tag=" + tags.join('+')
        }

        //wouldnt see request lib if defined at the top for some reason:\
        var request = require("request");
        //console.log(query)
        request(giphy_config.url + "?" + query, function (error, response, body) {
            //console.log(arguments)
            if (error || response.statusCode !== 200) {
                console.error("giphy: Got error: " + body);
                console.log(error);
                //console.log(response)
            }
            else {
                try{
                    var responseObj = JSON.parse(body)
                    func(responseObj.data.id);
                }
                catch(err){
                    func(undefined);
                }
            }
        }.bind(this));
}
<!-- Process Managment -->
process.on( 'SIGINT', function () {
  console.log("SIGINT signal");
  bot.destroy();
});

process.on( 'SIGTERM', function () {
  console.log("SIGTERM signal");
  bot.destroy();
});

process.on('exit', function (){
  console.log('Goodbye!');
  bot.destroy();
});
