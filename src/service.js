"use strict";
var monitor = require('node-docker-log-monitor');
var grok = require('node-grok');
var index_1 = require("metrix-js/lib/index");
var statsdHost = process.env.STATSD_HOST || 'localhost';
var statsdPort = process.env.STATSD_PORT || 8125;
var logPatternStr = process.env.LOG_PATTERN || '%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method}' +
    ' %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took}' +
    ' \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"';
var selectorLabel = process.env.SELECTOR_LABEL || 'monitor-logs';
var metrics;
try {
    metrics = JSON.parse(process.env.METRICS);
}
catch (e) {
}
if (!metrics || !metrics.length) {
    console.log('Could not read metric definitions from process.env.METRICS - using default');
    metrics = [
        { field: 'code', matcher: 'regex', match: '(\\d)\\d\\d', metric: 'router.hit.$100' },
        { field: 'code', matcher: 'regex', match: '\\d{3}', metric: 'router.hit' },
        { field: 'url', matcher: 'substring', match: 'api/note', metric: 'api.note.hit' },
        { field: 'url', matcher: 'substring', match: 'api/note', metric: 'api.hit' },
        { field: 'url', matcher: 'substring', match: 'api/policy', metric: 'api.hit' }
    ];
}
var SDC = require('statsd-client');
var sdc = new SDC({ host: statsdHost, port: statsdPort });
var collector = new index_1.MetricsCollector(function (metric) {
    sdc.increment(metric);
});
collector.addMetrics(metrics);
var patterns = grok.loadDefaultSync('grok-patterns');
var logPattern = patterns.createPattern(logPatternStr);
console.log("Starting up docker log monitor with parameters:\n+ statsdHost = " + statsdHost + "\n+ statsdPort = " + statsdPort + "\n+ logPatternStr = " + logPatternStr + "\n+ selectorLabel = " + selectorLabel);
monitor(function (event) {
    function logParsed(err, result) {
        if (!err) {
            collector.measure(result || {});
        }
    }
    if (event.log) {
        logPattern.parse(event.log, logParsed);
    }
}, null, { selectorLabel: selectorLabel });
//# sourceMappingURL=service.js.map