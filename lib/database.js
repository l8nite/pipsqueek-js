// set up our database connection
var redis = require('redis').createClient('6379', 'localhost');

redis.on('error', function (err) {
    console.log("Redis Error: " + err);
    process.exit(1);
});

redis.on('connect', function () {
    console.log("Redis Connected");
    redis.select(1);
});

exports.redis = redis;
