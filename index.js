const exec = require('child_process').execSync;
const wkDir = 'C:/Users/chongzhou/Desktop/Codes/annotation-tool-web/';

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080;

var fs = require('fs'); // required for file serving

var save_server = function (url, key) {
    var fs = require("fs");
    //过滤data:URL
    var base64Data = url.replace(/^data:image\/\w+;base64,/, '');
    var dataBuffer = new Buffer(base64Data, 'base64');
    var fileName = "./img/" + key + ".png";
    fs.writeFileSync(fileName, dataBuffer, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("图片保存成功！");
        }
    });
};

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Reaction
io.sockets.on('connection', function (socket) {
    console.log('new connection');

    socket.on('grabcut', function (url_img, url_mask) {
        save_server(url_img, 'image');
        save_server(url_mask, 'mask');

        exec('python grabcut.py', {cwd: wkDir}, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });

        var retMaskPath = __dirname + '/img/retMask.png';
        var buf = fs.readFileSync(retMaskPath);
        socket.emit('retImg', {buffer: buf.toString('base64')});
    });

    socket.on('matting', function (url_img, url_mask) {
        save_server(url_img, 'image');
        save_server(url_mask, 'mask');

        exec('python matting.py', {cwd: wkDir}, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });

        var retMaskPath = __dirname + '/img/retMask.png';
        var buf = fs.readFileSync(retMaskPath);
        socket.emit('retImg', {buffer: buf.toString('base64')});
    });

    socket.on('msg', function (msg) {
        console.log(msg);
    });
});