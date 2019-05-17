var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 8337;
function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
var clients = [];
var clientSocks = {};
var history = [];
var msgCounter = 0;
io.on('connection', function (socket) {

    console.log('an user connected');
    var userId;
    var userIdx;
    socket.on('disconnect', function () {
        console.log('user disconnected');
        clients.splice(userIdx);
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        var msgObj = JSON.parse(msg);
        
        userId = htmlEntities(msgObj.userid);
        var userName = htmlEntities(msgObj.name);
        var text = htmlEntities(msgObj.text);
        var recordId = htmlEntities(msgObj.id);
        var clientFound = false;
        for(var i=0;i<clients.length;i++) {
            if(clients[i] === userId) {
                clientFound = true;
                break;
            }
        }
        if(!clientFound) {
            userIdx = clients.push(userId);
            clientSocks[userId] = socket;
            for(var i=0;i<history.length;i++) {
                var json = JSON.stringify({ type: 'message', data: history[i] });
                socket.emit('chat message', json);
            }
        }
        console.log((new Date()) + ' Received Message from '
            + userName + ': ' + text);

        // we want to keep history of all sent messages
        var obj = {
            time: (new Date()).getTime(),
            text: text,
            name: userName,
            userid: userId,
            id: recordId,
            msgIdx: msgCounter++
        };
        history.push(obj);
        history = history.slice(-100);
        var json = JSON.stringify({ type: 'message', data: obj });
        for(var i=0;i<clients.length;i++) {
            if(clientSocks[clients[i]].connected) {
                clientSocks[clients[i]].emit('chat message', json);
            }
        }
        //io.emit('chat message', json);
        console.log("Clients:"+clients.length);
    });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});