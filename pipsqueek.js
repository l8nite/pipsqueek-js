var irc = require('irc-js');

process.addListener('uncaughtException', function (err) {
        console.log("Uncaught exception: " + err);
        console.trace();
});

irc.connect('./config.json', function (bot) {
    bot.join('#pipsqueek', function (channel) {});

    bot.match(irc.COMMAND.PRIVMSG, function (msg) {
        if (msg.forMe) {
            msg.reply(msg);
        }
    });
});
