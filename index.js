var nodeUrl = require('url');
var nodeQuerystring = require('querystring');
var nodeHttp = require('http');

module.exports = function(app) {
    var router = require('express').Router();
    var cfg = app.get('$config');
    if (!cfg) {
        console.warn('pandora-proxy', 'app 未找到 $config 属性，请确认是否已绑定Pandora');
    }
    if (!cfg.proxy) {
        console.warn('pandora-proxy', '请设置proxy');
        return;
    }
    for (var k in cfg.proxy) {
        (function(key, option) {
            if (!/\S\/$/.test(key)) {
                key += '/';
            }
            if (!option.hostname) {
                console.error('pandora-proxy', key, 'hostname is undefined')
            }
            router.all(key + '*', function(request, response) {
                var url = (option.url || '') + request.url.replace(key, '/');
                url = url.replace(/\/+/g, '/');

                (function getDate(cbl){
                    if(request.method === 'POST'){
                        var _postData = '';
                        request.on('data', function(chunk) {
                            _postData += chunk;
                        }).on('end', function() {
                            var defaultPostHeader = request.headers['content-type'];
                            if (defaultPostHeader && defaultPostHeader.indexOf('application/json') > -1) {
                                data = _postData;
                            } else {
                                data = nodeQuerystring.parse(_postData);
                            }
                            cbl(data);
                        });                        
                    }
                    else{
                        cbl(nodeQuerystring.parse(nodeUrl.parse(request.url).query));
                    }
                }(function(data){
                    var header = option.header || {};
                    header.cookie = header.cookie || {};
                    if (request.headers['content-type']) {
                        header['content-type'] = request.headers['content-type'];
                        // header['content-type'] = 'application/json;charset=UTF-8';//request.headers['content-type'];
                    }
                    extend(header.cookie, request.headers.cookie)
                    req_api(url, data, header, request.method, {
                        hostname: option.hostname,
                        port: option.port || 80
                    }, function(resData, cookie) {
                        if (cookie) {
                            for (var i in cookie) {
                                var c = cookie[i];
                                cookie[i] = c.replace(/domain.*?;/gi, '');
                            }
                            response.writeHead(200, {
                                'Set-Cookie': cookie,
                            });
                        }
                        response.write(resData + '', 'utf-8');
                        response.end();
                    });
                }));
            });
            app.use(router);
        }(k, cfg.proxy[k]));
    }
}

function req_api(url, data, header, method, host, callback) {
    var alldata = '';
    if (method === 'POST') {
        header['Content-Length'] = data.length || 0;
        var options = {
            hostname: host.hostname,
            port: host.port,
            path: url,
            method: 'POST',
            headers: header
        };

        console.info('proty to:%s', JSON.stringify(options))
        var req = nodeHttp.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                alldata += chunk;
            });
            res.on('end', function() {
                callback(alldata, res.headers['set-cookie']);
            });
        });
        req.on('error', function(e) {
            console.error('problem with options: ' + options);
            console.error('problem with data: ' + data);
            console.error('problem with request: ' + e.message);
        });
        req.write(data + '\n');
        req.end();
    } else {
        var options = {
            hostname: host.hostname,
            port: host.port,
            path: url,
            headers: header
        };
        var req = nodeHttp.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                alldata += chunk;
            });
            res.on('end', function() {
                callback(alldata, res.headers['set-cookie']);
                // callback(alldata);
            });
        });
        req.on('error', function(e) {
            console.log('problem with options: ' + options);
            console.log('problem with data: ' + data);
            console.log('problem with request: ' + e.message);
        });
    }
}

function extend(t, f) {
    for (var p in f) {
        t[p] = f[p];
    }
}