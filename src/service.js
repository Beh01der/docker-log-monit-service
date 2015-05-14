var monitor = require('node-docker-log-monitor');
var grok = require('node-grok');
require('collections/shim-object');

var empty = {};
grok.loadDefault(function (patterns) {
    console.log('Starting up docker log monitor...');

    var logPattern = patterns.createPattern('%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method}' +
    ' %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took}' +
    ' \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"');

    monitor(['nginx'], function (event) {
        function logParsed(err, result) {
            if (!err) {
                Object.addEach(event, result || empty);
                console.log(event);
            }
        }

        if (event.log) {
            logPattern.parse(event.log, logParsed);
        } else {
            console.log(event);
        }
    });
}, ['grok-patterns']);
