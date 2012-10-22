var pipsqueek = require('../lib/pipsqueek.js').pipsqueek;

pipsqueek.on('test', function (message) {
    message.reply('Testing, testing.  1, 2, 3...');
});
