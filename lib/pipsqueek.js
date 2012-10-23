var irc = require('./irc.js');
var util = require('util');

var PipSqueek = function (options) {
    PipSqueek.super_.call(this);

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

util.inherits(PipSqueek, require('events').EventEmitter);

PipSqueek.prototype._server_connected = function() {
    // set +B to identify us as a bot
    this.client.send('MODE', this.nick, '+B');
    this.client.send('JOIN', this.channel);
};

PipSqueek.prototype._message_received = function(prefix, recipient, text) {
    var sender = irc.user(prefix);

    var commandRegex = new RegExp('^(?:' + this.nick + '[:,]\\s*)?' + this.command_prefix + '([^\\s]+)\\s*(.*?)$');
    var command, cstring;

    if (commandRegex.test(text)) {
        var matches = text.match(commandRegex);
        command = matches[1];
        cstring = matches[2];
    }
    else {
        return;
    }

    var message = new Message({
        'prefix': prefix,
        'recipient': recipient,
        'text': text,
        'command': command,
        'cstring': cstring,
        'sender': sender
    });

    if (recipient == this.nick) {
        this.emit('private_' + command, message);
    }
    else {
        message.channel = recipient;
        this.emit('public_' + command, message);
    }

    this.emit(command, message);
};

PipSqueek.prototype.say = function (text, where) {
    console.log('pipsqueek.say(' + text + ', ' + where + ')');
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
