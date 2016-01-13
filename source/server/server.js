/**
 * Created by Administrator on 2015/08/16.
 */
var http = require('http');
var url = require('url');
var fs = require('fs');

var readFile = function (path, response) {
    fs.readFile(path, function (err, data) {
        if (err) {
            response.writeHead(404);
            response.end('something wrong');
            return;
        }
        response.writeHead(200);
        response.end(data);
    })
};
var server = http.createServer(function (request, response) {
    var param = url.parse(request.url, true);
    if (param.pathname == '/' || param.pathname == '/index.html') {
        readFile('./static/index.html',response);
    }else if(param.pathname=='/url'){
        response.writeHead(200,{'Content-Type':'application/json'});
        response.end(JSON.stringify({name:'zyt',age:'12'}));
    }else if(param.pathname=='/data.js'){
        var funcname=param.query['callbackname'];
        var str=funcname+'({name:"hello world"});';
        response.writeHead(200,{'Content-Type':'text/javascript'});
        response.end(str);
    }else{
        readFile(param.pathname.slice(1),response);
    }
});

server.listen(8080, function () {
    console.log('server start over');
});