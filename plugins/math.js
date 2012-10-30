var pipsqueek = require('../lib/pipsqueek.js').pipsqueek;

var matheval = require('matheval');
var variables = new matheval.Variables();

pipsqueek.on('math.*', function (message) {
    try {
        var result;
        _.each( message.cstring.split(';'), function (expr) {
            result = matheval.evaluate(expr, variables);
            variables.set('_', result);
        });
        message.respond(result);
    }
    catch (e) {
        message.reply(e);
    }
});
