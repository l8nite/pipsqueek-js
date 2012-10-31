var pipsqueek = require('../lib/pipsqueek.js').pipsqueek;
var redis = require('../lib/database.js').redis;

var matheval = require('matheval');

pipsqueek.on('math.*', function(message) {
    var variables = new MathVariables(message.user);

    variables.load(function () {
        try {
            var result;
            _.each(message.cstring.split(';'), function(expr) {
                result = matheval.evaluate(expr, variables);
            });
            variables.set('_', result);
            variables.save(function() {
                message.respond(result);
            });
        }
        catch (e) {
            message.reply(e);
        }
    });
});

var MathVariables = function(user) {
    MathVariables.super_.call(this);
    this.user = user;
};

require('util').inherits(MathVariables, matheval.Variables);

MathVariables.prototype.load = function(doneLoading) {
    var username = this.user.data.username;
    var variables = this.variables;

    redis.hgetall('math-variables:' + username, function (err, data) {
        if (!err) {
            _.extend(variables, data);
        }
        doneLoading();
    });
};

MathVariables.prototype.save = function(doneSaving) {
    var variables = this.variables;
    var username = this.user.data.username;

    // hmset requires object values to be stringified
    _.each(variables, function (value, key, list) {
        list[key] = "" + value;
    });

    redis.hmset('math-variables:' + username, variables, function (err, reply) {
        doneSaving();
    });
};
