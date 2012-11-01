var irc = require('./irc.js');

var PipSqueek = function(options) {
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

    this.client.on('001', serverConnected.bind(this));
    this.client.on('433', nicknameInUse.bind(this));
    this.client.on('PRIVMSG', messageReceived.bind(this));
    this.on('ctcp.version', ctcpVersion.bind(this));
};

require('util').inherits(PipSqueek, require('eventemitter2').EventEmitter2);

var ctcpVersion = function(message) {
    message.ctcpReply('VERSION pipsqueek-js - rawr!');
};

var serverConnected = function() {
    this.mode('+B'); // set +B to identify us as a bot
    this.join();
};

var nicknameInUse = function() {
    this.client.send('NICK', this.nick + '_');
    this.join();
};

var messageReceived = function(prefix, recipient, text) {
    var message = new Message({
        'prefix': prefix,
        'recipient': recipient,
        'sender': irc.user(prefix),
        'text': text
    });

    var self = this;

    User.loadFromNickname(message.sender, function(err, user) {
        if (user !== null) {
            message.user = user;
        }

        parseCommands.call(self, message);
    });
};

var parseCommands = function(message) {
    // convert CTCP messages to events
    var ctcpRegex = new RegExp("^\u0001(.*?)\u0001$");
    if (ctcpRegex.test(message.text)) {
        var matches = message.text.match(ctcpRegex);
        this.emit('ctcp.' + matches[1].toLowerCase(), message);
        return;
    }

    var isPrefixOptional = message.recipient === this.nick ? '?' : '';

    var commandRegex = new RegExp('^(?:' + this.nick + '[:,]\\s*' + this.command_prefix + '?|' + this.command_prefix + isPrefixOptional + ')([^\\s]+)\\s*(.*?)$');

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

PipSqueek.prototype.say = function(text, where) {
    this.client.send('PRIVMSG', where || this.channel, text || '!@#$%');
};

PipSqueek.prototype.act = function(text, where) {
    this.ctcp('ACTION ' + (text || '!@#$%'), where);
};

PipSqueek.prototype.ctcp = function(text, where) {
    this.client.send('PRIVMSG', where || this.channel, "\001" + text + "\001");
};

PipSqueek.prototype.join = function (channel) {
    this.client.send('JOIN', channel ? channel : this.channel);
};

PipSqueek.prototype.mode = function (mode) {
    this.client.send('MODE', this.nick, mode);
};

PipSqueek.prototype.nick = function (nick) {
    this.client.send('NICK', nick ? nick : this.nick);
};

PipSqueek.prototype.connect = function(options) {
    _.extend(this, options);
    this.client.connect(this.nick, this.ident, this.real);
};

module.exports.pipsqueek = new PipSqueek();

var Message = require('./message.js').Message;
var User = require('./user.js').User;

