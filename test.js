var redis = require('./lib/database.js').redis;

var data = { 'a': '2', 'b': '2', 'c': '2' };

redis.hmset('foo', data, function (err, reply) { console.log(reply); });
