var Client = require('./irc.js').Client;
var Message = require('./message.js').Message;

var PipSqueek = function() {
    PipSqueek.super_.call(this, {
        wildcard: true // enable wildcard event listeners
    });

    _.defaults(this, {
        channel: '#pipsqueek',
        nick: 'pipsqueek',
        ident: 'pipsqueek',
        real: 'pipsqueeek',
        command_prefix: '@'
    });

    this.client = new Client('idlemonkeys.net', '6667');

    var self = this;
    this.client.onAny(function() {
        var event = this.event;
        Message.createFromEvent(event, arguments, self, function(message) {
            self.emit('irc.' + event.toLowerCase(), message, arguments);
        });
    });
};

require('util').inherits(PipSqueek, require('eventemitter2').EventEmitter2);

PipSqueek.prototype.say = function(text, where) {
    this.client.send('PRIVMSG', where || this.channel, text || '!@#$%');
};

PipSqueek.prototype.act = function(text, where) {
    this.ctcp('ACTION ' + (text || '!@#$%'), where || this.channel);
};

PipSqueek.prototype.ctcp = function(text, where) {
    this.client.send('PRIVMSG', where || this.channel, "\001" + text + "\001");
};

PipSqueek.prototype.ctcpReply = function(text, where) {
    this.client.send('NOTICE', where || this.channel, "\001" + text + "\001");
};

PipSqueek.prototype.join = function(channel) {
    this.client.send('JOIN', channel ? channel : this.channel);
};

PipSqueek.prototype.mode = function(mode) {
    this.client.send('MODE', this.nick, mode);
};

PipSqueek.prototype.nick = function(nick) {
    this.client.send('NICK', nick ? nick : this.nick);
};

PipSqueek.prototype.connect = function(options) {
    _.extend(this, options);
    this.client.connect(this.nick, this.ident, this.real);
};

module.exports.pipsqueek = new PipSqueek();


// past this point is code relying on the standard pipsqueek plugin interface

/*
    this.client.on('001', serverConnected.bind(this));
    this.client.on('433', nicknameInUse.bind(this));
    this.client.on('PRIVMSG', messageReceived.bind(this));
    this.client.on('JOIN', userJoined.bind(this));
    this.client.on('PART', userFarted.bind(this));

    this.on('ctcp.version', ctcpVersion.bind(this));
    */

var userJoined = function() {
    //event: JOIN
    //{ '0': ':shaun!shaun@oper.idlemonkeys.net', '1': '#pipsqueek' }
    var message = this.parseMessage(arguments);
    //console.log(message.user.username + ' JOINED!');

};

var userFarted = function() {
    //event: PART
    //{ '0': ':shaun!shaun@oper.idlemonkeys.net', '1': '#pipsqueek' }
    var message = this.parseMessage(arguments);
    //console.log(message.user.username + ' FARTED!');
};

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


PipSqueek.prototype.parseMessage = function(args) {
    var message = new Message({
        'prefix': args[0],
        'recipient': args[1],
        'text': args[2]
    });

    message.sender = irc.user(args[0]);
};

var messageReceived = function() {
    var message = this.parseMessage(arguments);

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
