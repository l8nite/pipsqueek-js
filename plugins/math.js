var pipsqueek = require('../lib/pipsqueek.js').pipsqueek;
var TapDigit = require('../lib/TapDigit.js');

var context = new TapDigit.Context();

var evaluator = new TapDigit.Evaluator(context);

pipsqueek.on('math', function (message) {
    try {
        var result;
        _.each( message.cstring.split(';'), function (expr) {
            result = evaluator.evaluate(expr);
        });
        message.respond(result);
    }
    catch (e) {
        message.reply(e);
    }
});
