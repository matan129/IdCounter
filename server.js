//load modules
var http = require('http'),
    fs = require('fs'),
    qs = require('querystring'),
    validator = require('./validator.js');

//create server at port 80 (http)
http.createServer(function (req, res) {
    //listen to POST requests containing our form
    if (req.method === 'POST') {
        processPost(req, res, function () {
            //analyze names
            var identitiesResult = validator.countUniqueNames(req.post.bFirstName, req.post.bLastName,
                req.post.sFirstName, req.post.sLastName, req.post.bNameOnCard);

            //deliver response
            res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            res.write("found " + identitiesResult + " identities.");
            res.end();
        });
    } else {
        //deliver the "checkout form" HTML
        fs.readFile('form.html', function (err, data) {
            res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
            res.write(data);
            res.end();
        });
    }
}).listen(80);

//POST requests processor
function processPost(request, response, callback) {
    //check if the callback function is indeed a function
    if (typeof callback !== 'function') return null;

    //setup query data
    var queryData = "";

    //handle only POST requests
    if (request.method == 'POST') {

        //receive data. also destroy floods (too much data in the request), just in case
        request.on('data', function (data) {
            queryData += data;

            //nuke floods.
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        //call the callback when finished receiving the data
        request.on('end', function () {
            request.post = qs.parse(queryData);
            callback();
        });
    }
}