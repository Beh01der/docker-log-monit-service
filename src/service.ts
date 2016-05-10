import monitor = require('node-docker-log-monitor');
import grok = require('node-grok');
import { MetricsCollector } from "metrix-js/lib/index";

let statsdHost = process.env.STATSD_HOST || 'localhost';
let statsdPort = process.env.STATSD_PORT || 8125;
let logPatternStr = process.env.LOG_PATTERN || '%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method}' +
    ' %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took}' +
    ' \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"';
let selectorLabel = process.env.SELECTOR_LABEL || 'monitor-logs';
let metrics;
try {
    metrics = JSON.parse(process.env.METRICS);
} catch(e) {
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

let SDC = require('statsd-client');
let sdc = new SDC({host: statsdHost, port: statsdPort});
let collector = new MetricsCollector(metric => {
    sdc.increment(metric);
});
collector.addMetrics(metrics);

let patterns = grok.loadDefaultSync('grok-patterns');
let logPattern = patterns.createPattern(logPatternStr);

console.log(`Starting up docker log monitor with parameters:
+ statsdHost = ${ statsdHost }
+ statsdPort = ${ statsdPort }
+ logPatternStr = ${ logPatternStr }
+ selectorLabel = ${ selectorLabel }`);

monitor(function (event) {
    function logParsed(err, result) {
        if (!err) {
            collector.measure(result || {});
        }
    }

    if (event.log) {
        logPattern.parse(event.log, logParsed);
    }
}, null, {selectorLabel: selectorLabel});
