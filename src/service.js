var monitor = require('node-docker-log-monitor');
var grok = require('node-grok');
require('collections/shim-object');

var empty = {};
grok.loadDefault(function (patterns) {
    console.log('Starting up docker log monitor...');

    var SDC = require('statsd-client'),
        sdc = new SDC({host: '172.17.42.1', port: 8125});

    var logPattern = patterns.createPattern('%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method}' +
    ' %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took}' +
    ' \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"');

    monitor(['nginx'], function (event) {
        function logParsed(err, result) {
            if (!err) {
                Object.addEach(event, result || empty);
                var code;
                if (event.code && (code = parseInt(event.code))) {
                    sdc.increment('router.hit');
                    sdc.increment('router.hit.' + (Math.floor(code / 100) * 100));
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
}, ['grok-patterns']);