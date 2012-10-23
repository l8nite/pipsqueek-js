global._ = require('underscore')._;

var pipsqueek = require('./lib/pipsqueek.js').pipsqueek;

// load plugins
require('./plugins/test.js');
require('./plugins/math.js');

// connect to the server
pipsqueek.connect({
    nick: 'pipsqueek-js'
    // , channel: '#idlemonkeys'
});
