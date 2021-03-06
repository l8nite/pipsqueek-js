global._ = require('underscore')._;

var pipsqueek = require('./lib/pipsqueek.js').pipsqueek;

// load plugins
require('./plugins/test.js');
require('./plugins/math.js');

// connect to the server
pipsqueek.connect({
    nick: 'pipsqueek-js'
    ,channel: '#pipsqueek'
});

pipsqueek.client.on('*', function () {
    console.log("event: " + this.event);
    console.log(arguments);
});
