var pipsqueek = require('./pipsqueek.js').pipsqueek;
var redis = require('./database.js').redis;
var step = require('step');

var User = function (data) {
    User.super_.call(this);

    this.data = {};
    _.extend(this.data, data);
};

require('util').inherits(User, Object);

User.prototype.save = function (callback) {
    var key = 'users:' + this.data.username;
    var value = JSON.stringify(this.data);

    var self = this;
    redis.set(key, value, function (err, reply) {
        if (callback !== null) {
            callback(err, self);
        }
    });
};

User.prototype.set = function (key, value) {
    data[key] = value;
    this.save();
};

User.prototype.get = function(key) {
    return data[key];
};

User.load_from_nickname = function (nickname, callback) {
    var username;

    // username-for:<nickname> stores the username associated with that nickname
    var key = 'username-for:' + nickname;

    step(
    function () {
        redis.get(key, this);
    },
    function (err, reply) {
        if (reply !== null) {
            username = reply;
            this(null);
        }
        else {
            username = nickname;
            redis.set(key, username, this);
        }
    },
    function () {
        User.load_from_username(username, callback);
    }
    );
};

User.load_from_username = function (username, callback) {
    // users:<username> stores the actual user record (serialized as JSON)
    var key = 'users:' + username;
    var data = {};
    var user;

    step(
    function () {
        redis.get(key, this);
    },
    function (err, reply) {
        if (reply !== null) {
            return new User(JSON.parse(reply));
        }
        else {
            data.created = (new Date()).toJSON();
            data.username = username;
            data.nickname = username;
            user = new User(data);
            user.save(this);
        }
    },
    function (err, user) {
        callback(null, user);
    });
};

exports.User = User;
