var pipsqueek = require('./pipsqueek.js').pipsqueek;

var Message = function (data) {
    Message.super_.call(this);
    _.extend(this, data);
};

require('util').inherits(Message, Object);

Message.prototype.reply = function (text) {
    pipsqueek.say(text, this.channel ? this.channel : this.sender);
};

Message.prototype.respond = function (text) {
    this.reply(this.sender + ': ' + text);
};

Message.prototype.reply_act = function (text) {
    pipsqueek.act(text, this.channel ? this.channel : this.sender);
};

exports.Message = Message;
