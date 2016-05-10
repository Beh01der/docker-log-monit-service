# docker-log-monit-service
Simple log monitor / metrics collector service for docker containers with StatsD integration.
It listens for logs from docker containers then generates metrics based on supplied rules. Metrics then sent to StatsD.

**docker-log-monit-service** uses: 
* [node-docker-log-monitor](https://www.npmjs.com/package/node-docker-log-monitor) for docker log monitoring
* [node-grok](https://www.npmjs.com/package/node-grok) for log parsing 
* [metrix-js](https://www.npmjs.com/package/metrix-js) for metrics generation
* [statsd-client](https://www.npmjs.com/package/statsd-client) for communication with StatsD

## Run
On host: `node src/service.js`
In Docker container: `docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker/containers:/var/lib/docker/containers:ro beh01der/docker-log-monit-service`

## Configuration parameters
**docker-log-monit-service** is configured through environment variables:
* STATSD_HOST - StatsD host name ('localhost')
* STATSD_PORT - StatsD port number (8125)
* LOG_PATTERN - log pattern in **grok** format (`%{IP:client} \\[%{TIMESTAMP_ISO8601:timestamp}\\] "%{WORD:method} %{URIHOST:site}%{URIPATHPARAM:url}" %{INT:code} %{INT:request} %{INT:response} - %{NUMBER:took} \\[%{DATA:cache}\\] "%{DATA:mtag}" "%{DATA:agent}"`)
* SELECTOR_LABEL - Docker container label to be used to mark containers that should be monitored ('monitor-logs') 
* METRICS - metric definitions for [metrix-js](https://www.npmjs.com/package/metrix-js)
```
[
    { field: 'code', matcher: 'regex', match: '(\\d)\\d\\d', metric: 'router.hit.$100' },
    { field: 'code', matcher: 'regex', match: '\\d{3}', metric: 'router.hit' },
    { field: 'url', matcher: 'substring', match: 'api/note', metric: 'api.note.hit' },
    { field: 'url', matcher: 'substring', match: 'api/note', metric: 'api.hit' },
    { field: 'url', matcher: 'substring', match: 'api/policy', metric: 'api.hit' }
]
```

## License 
**ISC License (ISC)**

Copyright (c) 2015, Andrey Chausenko <andrey.chausenko@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
