const Discord = require('discord.js');
const qs = require('querystring');
const fs = require('fs');

class UnPoilBot {

    constructor() {
        this.client = new Discord.Client();
        this.client.on('ready', this.ready.bind(this));
        this.clientOn();
        this.commands = this.loadCommands();
        this.config = this.loadConfig();

        // Load custom permissions
        this.dangerousCommands = ["eval", "pullanddeploy", "setUsername"];
        this.permissions = this.loadPermissions();

        this.aliases = this.loadAliases();

        this.startTime = Date.now();
        this.discordApiKey = process.env.discordApiKey;
        this.twitchClientId = process.env.twitchClientId;

        this.giphy_config = {
            "api_key": "dc6zaTOxFJmzC",
            "rating": "r",
            "url": "http://api.giphy.com/v1/gifs/random",
            "permission": ["NORMAL"]
        };
        
    }

    start() {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
        console.log("Starting DiscordBot\nNode version: " + process.version + "\nDiscord.js version: " + Discord.version);

        this.checkApiKey();

        this.client.login(this.discordApiKey, (error) => {
            if (error) return console.log('[Login]' + error);
        });
    }

    ready() {
        console.log(`Logged in as ${this.client.user.tag}!`);
        console.log(`Serving in ${this.client.guilds.array().length} servers`);
        console.log(`type  ${this.config.commandPrefix}help in Discord for a commands list.`);
        this.client.user.setStatus("online", this.config.commandPrefix + "help");
    }

    loadPermissions() {
        var Permissions = {};
        try {
            Permissions = require("./permissions.json");
        } catch (e) {
            console.log('Erreur init permissions');
            Permissions.global = {};
            Permissions.users = {};
        }

        for (var i = 0; i < this.dangerousCommands.length; i++) {
            var cmd = this.dangerousCommands[i];
            if (!Permissions.global.hasOwnProperty(cmd)) {
                Permissions.global[cmd] = false;
            }
        }
        //fs.writeFile("./permissions.json", JSON.stringify(Permissions, null, 2));
        return Permissions;
    }

    loadConfig() {
        //load config data
        var Config = {};
        try {
            Config = require("./config.json");
        } catch (e) { //no config file, use defaults
            Config.debug = false;
            Config.commandPrefix = '!';
            try {
                if (fs.lstatSync("./config.json").isFile()) {
                    console.log("WARNING: config.json found but we couldn't read it!\n" + e.stack);
                }
            } catch (e2) {
                fs.writeFile("./config.json", JSON.stringify(Config, null, 2));
            }
        }
        if (!Config.hasOwnProperty("commandPrefix")) {
            Config.commandPrefix = '!';
        }
        return Config;
    }

    checkPermission(user, permission) {
        try {
            var allowed = true;
            try {
                if (this.permissions.global.hasOwnProperty(permission)) {
                    console.log("Check permission : " + permission);
                    allowed = this.permissions.global[permission] === true;
                }
            } catch (e) {
                console.error('Permission error : ' + permission + ' -> ' + e);
            }
            try {
                if (this.permissions.users.hasOwnProperty(user.id)) {
                    if (this.permissions.users[user.id].hasOwnProperty(permission)) {
                        console.log("Check permission : " + user.id + " - " + permission);
                        allowed = this.permissions.users[user.id][permission] === true;
                    }
                }
            } catch (e) {
                console.error('Permission error : ' + user.id + " - " + permission);
            }
            return allowed;
        } catch (e) {
            console.error('Default Permission error');
        }
        return false;
    }

    on(e, f) {
        this.client.on(e, f);
    }

    isEmpty(value) {
        return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
    }

    loadCommands() {
        const commands = {
            "aliases": {
                description: "lists all recorded aliases",
                process: function (bot, msg) {
                    var text = "current aliases:\n"; for (var a in this.aliases) {
                        if (typeof a === 'string')
                            text += a + " ";
                    }
                    msg.channel.send(text);
                }
            },
            "ping": {
                description: "responds pong, useful for checking if bot is alive",
                process: function(bot, msg, suffix) {
                    msg.channel.send(msg.author + " pong!");
                    if (suffix) {
                        msg.channel.send("note that !ping takes no arguments!");
                    }
                }
            },
            "uptime": {
                usage: "",
                description: "returns the amount of time since the bot started",
                process: function (bot, msg) {
                    var now = Date.now();
                    var msec = now - this.startTime;
                    console.log("Uptime is " + msec + " milliseconds");
                    var days = Math.floor(msec / 1000 / 60 / 60 / 24);
                    msec -= days * 1000 * 60 * 60 * 24;
                    var hours = Math.floor(msec / 1000 / 60 / 60);
                    msec -= hours * 1000 * 60 * 60;
                    var mins = Math.floor(msec / 1000 / 60);
                    msec -= mins * 1000 * 60;
                    var secs = Math.floor(msec / 1000);
                    var timestr = "";
                    if (days > 0) {
                        timestr += days + " days ";
                    }
                    if (hours > 0) {
                        timestr += hours + " hours ";
                    }
                    if (mins > 0) {
                        timestr += mins + " minutes ";
                    }
                    if (secs > 0) {
                        timestr += secs + " seconds ";
                    }
                    msg.channel.send("**Uptime**: " + timestr);
                }
            },
            "wow": {
                usage: "<personnage>-<serveur>",
                description: "Affiche le lien de l'armurerie Wow pour le personnage et le serveur indiqué",
                process: function (bot, msg, suffix) {
                    if (suffix) {
                        var userwowtab = suffix.split("-")
                        if (userwowtab.length == 2) {
                            var url = "http://eu.battle.net/wow/fr/character/" + encodeURIComponent(userwowtab[1]) + "/" + encodeURIComponent(userwowtab[0]) + "/advanced";
                            let msgOK = "WOW Amory pour le personnage " + userwowtab[0] + " du serveur " + userwowtab[1] + "\n" + url;
                            let msgKO = "Ce personnage n'existe pas ou n'est pas sur ce serveur.";
                            this.useWowUrl(url, msg, msgOK, msgKO);
                        } else {
                            msg.reply("Le format de la commande doit être !wow personnage-serveur");
                        }

                    } else {
                        msg.reply("Le format de la commande doit être !wow personnage-serveur");
                    }
                }.bind(this)
            },
            "twitch": {
                usage: "<stream>",
                description: "checks if the given stream is online",
                process: function (bot, msg, suffix) {
                    try {
                        var request = require("request");
                        request("https://api.twitch.tv/kraken/streams/" + suffix + "?client_id=" + this.twitchClientId,
                            function (err, res, body) {
                                //Check for error
                                if (err) {
                                    return console.log('Error:', err);
                                }
                                var stream = JSON.parse(body);
                                if (stream.stream) {
                                    msg.channel.send(suffix
                                        + " est online, joue à "
                                        + stream.stream.game
                                        + "\n" + stream.stream.channel.status
                                        + "\n" + stream.stream.preview.large);
                                    msg.channel.send("Regarder " + suffix + " : " + "https://www.twitch.tv/" + suffix);
                                } else {
                                    msg.channel.send(suffix + " est offline")
                                }
                            });
                    } catch (e) {
                        console.log("Erreur lors de la commande twitch ! " + e);
                        msg.channel.send("Commande twitch indisponible pour le moment.")
                    }

                }.bind(this)
            },
            "gif": {
                usage: "<image tags>",
                description: "returns a random gif matching the tags passed",
                process: function (bot, msg, suffix) {
                    var tags = suffix.split(" ");
                    this.get_gif(tags, function (id) {
                        if (typeof id !== "undefined") {
                            msg.channel.send("http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
                        }
                        else {
                            msg.channel.send("Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
                        }
                    });
                }
            },
        };
        return commands;
    }

    loadAliases() {
        var Aliases = {};
        try {
            Aliases = require("./alias.json");
        } catch (e) {
            //No aliases defined
        }
        return Aliases;
    }
    useWowUrl(url, msg, msgOK, msgKO) {
        var request = require("request");
        
        request(url, { json: true }, (err, res) => {
            if(res.statusCode === 200) {
                msg.channel.send(msgOK);
            } else {
                msg.channel.send(msgKO);
            }
        });
    
        
    }

    checkMessageForCommand(msg, isEdit) {
        //check if message is a command
        if (msg.author.id != this.client.user.id && (msg.content[0] === this.config.commandPrefix)) {
            console.log("treating " + msg.content + " from " + msg.author.username + " as command");
            var cmdTxt = msg.content.split(" ")[0].substring(1);
            var suffix = msg.content.substring(cmdTxt.length + 2);//add one for the ! and one for the space
            if (msg.isMentioned(this.client.user)) {
                try {
                    cmdTxt = msg.content.split(" ")[1];
                    suffix = msg.content.substring(this.client.user.mention().length + cmdTxt.length + 2);
                } catch (e) { //no command
                    msg.channel.send("Oui ?");
                    return;
                }
            }
            const alias = this.aliases[cmdTxt];
            if (alias) {
                console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
                cmdTxt = alias[0];
                suffix = alias[1] + " " + suffix;
            }
            var cmd = this.commands[cmdTxt];
            if (cmdTxt === "help") {
                //help is special since it iterates over the other commands
                if (suffix) {
                    var cmds = suffix.split(" ").filter(function(cmd) { 
                        if(!this.commands.hasOwnProperty(cmd)) {
                            msg.channel.send(cmd + " n'est pas une commande !");
                        }
                        return this.commands[cmd] 
                    }.bind(this));
                    var info = "";
                    for (var i = 0; i < cmds.length; i++) {
                        var subCmd = cmds[i];
                        info += "**" + this.config.commandPrefix + subCmd + "**";
                        var usage = this.commands[subCmd].usage;
                        if (usage) {
                            info += " " + usage;
                        }
                        var description = this.commands[subCmd].description;
                        if (description instanceof Function) {
                            description = description();
                        }
                        if (description) {
                            info += "\n\t" + description;
                        }
                        info += "\n"
                    }
                    if(info.length > 0) {
                        msg.channel.send(info);
                    }
                } else {

                    msg.author.send("**Available Commands:**").then(function() {
                        var batch = "";
                        var sortedCommands = Object.keys(this.commands).sort();
                        for (var i in sortedCommands) {
                            var cmd = sortedCommands[i];
                            var info = "**" + this.config.commandPrefix + cmd + "**";
                            var usage = this.commands[cmd].usage;
                            if (usage) {
                                info += " " + usage;
                            }
                            var description = this.commands[cmd].description;
                            if (description instanceof Function) {
                                description = description();
                            }
                            if (description) {
                                info += "\n\t" + description;
                            }
                            var newBatch = batch + "\n" + info;
                            if (newBatch.length > (1024 - 8)) { //limit message length
                                msg.author.send(batch);
                                batch = info;
                            } else {
                                batch = newBatch
                            }
                        }
                        if (batch.length > 0) {
                            msg.author.send(batch);
                        }
                    }.bind(this));
                }
            }
            else if (cmd) {
                if (this.checkPermission(msg.author, cmdTxt)) {
                    try {
                        cmd.process(this.client, msg, suffix, isEdit);
                    } catch (e) {
                        var msgTxt = "command " + cmdTxt + " failed :(";
                        if (this.config.debug) {
                            msgTxt += "\n" + e.stack;
                        }
                        msg.channel.send(msgTxt);
                    }
                } else {
                    msg.channel.send("You are not allowed to run " + cmdTxt + "!");
                }
            } else {
                msg.channel.send(cmdTxt + " not recognized as a command!").then((message => message.delete(5000)))
            }
        } else {
            //message isn't a command or is from us
            //drop our own messages to prevent feedback loops
            if (msg.author == this.client.user) {
                return;
            }

            if (msg.author != this.client.user && msg.isMentioned(this.client.user)) {
                msg.channel.send(msg.author + ", vous m'avez appelé ?");
            }
        }
    }

    clientOn() {

        this.client.on("error", (error) => {
            console.error("Erreur d'initialisation du client Discord : " + error.message);
            process.exit(1);
        });

        this.client.on("message", (msg) => {
            this.checkMessageForCommand(msg, false);
        });

        this.client.on("messageUpdate", (oldMessage, newMessage) => {
            this.checkMessageForCommand(newMessage, true);
        });

        this.client.on("disconnected", function() {

            console.log("Disconnected!");
            process.exit(0); //exit node.js with an error

        });

        process.on("SIGINT", () => {
            console.log("SIGINT signal");
            this.client.destroy();
        });

        process.on('SIGTERM', function() {
            console.log("SIGTERM signal");
            this.client.destroy();
        }.bind(this));

        process.on('exit', function() {
            console.log('Goodbye!');
            this.client.destroy();
        }.bind(this));

    }
    checkApiKey() {
        if (this.isEmpty(this.discordApiKey)) {
            console.log("Variable d'environnement discordApiKey manquante.");
            this.client.destroy();
            process.exit(1);
        }  
    }

    get_gif(tags, func) {
        //limit=1 will only return 1 gif
        var params = {
            "api_key": this.giphy_config.api_key,
            "rating": this.giphy_config.rating,
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
        request(this.giphy_config.url + "?" + query, function(error, response, body) {
            //console.log(arguments)
            if (error || response.statusCode !== 200) {
                console.error("giphy: Got error: " + body);
                console.log(error);
                //console.log(response)
            }
            else {
                try {
                    var responseObj = JSON.parse(body)
                    func(responseObj.data.id);
                }
                catch (err) {
                    func(undefined);
                }
            }
        }.bind(this));
    }


}

module.exports = UnPoilBot;
