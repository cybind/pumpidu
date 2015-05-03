var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var SERVER_PORT = '1234';

var app = http.createServer(function(req, res) {
    file.serve(req, res);
}).listen(SERVER_PORT);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket) {

    socket.on('message', function(message) {
        socket.broadcast.emit('message', message); // should be room only
    });
    
});