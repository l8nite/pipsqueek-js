var pipsqueek = require('../lib/pipsqueek.js').pipsqueek;
var TapDigit = require('../lib/TapDigit.js');

var context = new TapDigit.Context();

var evaluator = new TapDigit.Evaluator(context);

pipsqueek.on('math', function (message) {
    try {
        result = evaluator.evaluate(message.cstring);
        message.respond(message.cstring + ' = ' + result);
    }
    catch (e) {
        message.reply(e);
    }
});
