var irc = require('./irc.js');

var PipSqueek = function (options) {
    PipSqueek.super_.call(this, {
        wildcard: true // enable wildcard event listeners
    });

    this.client = new irc.Client('idlemonkeys.net', '6667');

    _.defaults(this, {
        channel: '#pipsqueek',
        nick: 'pipsqueek',
        ident: 'pipsqueek',
        real: 'pipsqueeek',
        command_prefix: '@'
    });

    this.client.on('001', this._server_connected.bind(this));
    this.client.on('PRIVMSG', this._message_received.bind(this));
};

require('util').inherits(PipSqueek, require('eventemitter2').EventEmitter2);

PipSqueek.prototype._server_connected = function() {
    // set +B to identify us as a bot
    this.client.send('MODE', this.nick, '+B');
    this.client.send('JOIN', this.channel);
};

PipSqueek.prototype._message_received = function(prefix, recipient, text) {
    var message = new Message({
        'prefix': prefix,
        'recipient': recipient,
        'sender': irc.user(prefix),
        'text': text
    });

    var self = this;

    User.load_from_nickname(message.sender, function (err, user) {
        if (user !== null) {
            message.user = user;
        }

        self._parse_commands(message);
    });
};

PipSqueek.prototype._parse_commands = function (message) {
    var commandRegex = new RegExp('^(?:' + this.nick + '[:,]\\s*)?' + this.command_prefix + '([^\\s]+)\\s*(.*?)$');

    if (commandRegex.test(message.text)) {
        var matches = message.text.match(commandRegex);
        message.command = matches[1];
        message.cstring = matches[2];
    }
    else {
        this.emit('privmsg', message);
        return;
    }

    // emit public/private events
    if (message.recipient == this.nick) {
        this.emit(message.command + '.private', message);
    }
    else {
        message.channel = message.recipient;
        this.emit(message.command + '.public', message);
    }
};

PipSqueek.prototype.say = function (text, where) {
    this.client.send('PRIVMSG', where || this.channel, text || '!@#$%');
};

PipSqueek.prototype.act = function (text, where) {
    this.ctcp('ACTION ' + (text || '!@#$%'), where);
};

PipSqueek.prototype.ctcp = function (text, where) {
    this.client.send('PRIVMSG', where || this.channel, "\001" + text + "\001");
};

PipSqueek.prototype.connect = function (options) {
    _.extend(this, options);
    this.client.connect(this.nick, this.ident, this.real);
};

module.exports.pipsqueek = new PipSqueek();

// requiring Message here avoids the cyclic dependency of
// pipsqueek.js->message.js->pipsqueek.js
var Message = require('./message.js').Message;
var User = require('./user.js').User;
