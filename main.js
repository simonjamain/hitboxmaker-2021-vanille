const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/dist'));

io.on('connection', (socket) => {
	socket.on('event', (msg) => {
	  io.emit('event', msg);
	});
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
