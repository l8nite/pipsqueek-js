var pipsqueek = require('../lib/pipsqueek.js').pipsqueek;
var TapDigit = require('../lib/TapDigit.js');

var evaluator = new TapDigit.Evaluator();

pipsqueek.on('math', function (message) {
    try {
        result = evaluator.evaluate(message.cstring);
        message.respond(message.cstring + ' = ' + result);
    } catch (e) {
        message.reply(e);
    }
});
