var irc = require("irc-js");

var pipsqueek = function (bot) {
    console.log("Connected.");

    bot.join('#idlemonkeys', function (channel) {
        channel.say('Hello!');
    });
};

irc.connect('./config.json', pipsqueek);
