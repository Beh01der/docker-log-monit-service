var monitor = require('node-docker-log-monitor');
var grok = require('node-grok');
require('collections/shim-object');

var empty = {};

var SDC = require('statsd-client'),
    sdc = new SDC({host: '172.17.42.1', port: 8125});

var patterns = grok.loadDefaultSync('grok-patterns');
var logPattern = patterns.createPattern('%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method}' +
' %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took}' +
' \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"');

console.log('Starting up docker log monitor...');
monitor(['router'], function (event) {
    function logParsed(err, result) {
        if (!err) {
            Object.addEach(event, result || empty);
            var code;
            if (event.code && (code = parseInt(event.code))) {
                sdc.increment('router.hit');
                sdc.increment('router.hit.' + (Math.floor(code / 100) * 100));
            }

            if (event.url) {
                if (event.url.indexOf('api/note') != -1) {
                    sdc.increment('api.note.hit');
                    sdc.increment('api.hit');
                } else if (event.url.indexOf('api/policy') != -1) {
                    sdc.increment('api.hit');
                }
            }
        }

        console.log(event);
    }

    if (event.log) {
        logPattern.parse(event.log, logParsed);
    } else {
        console.log(event);
    }
});
