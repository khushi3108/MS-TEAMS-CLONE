const express = require('express');
const app = express()//creating app type of express.
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port= 3000 || process.env.PORT
//loading static files from thier directory
app.use(express.static(__dirname + "/public"))

let clients = 0
//initial clients =0
//setting io connections when both clients ready ans as soon as front-end and back-end connection is made
io.on('connection', function (socket) {
    socket.on("NewUser", function () {
        if (clients < 2) {
            if (clients == 1) {
                this.emit('createClient')//chk if no of clients <2 and if =1 then we want socket to make a callback to createPeer
            }
        }
        else
            this.emit('sessionActive')//session already going on
        clients++;
    })
    socket.on('offer', makeOffer)
    socket.on('Answer', sendAnswer)
    socket.on('disconnect', Disconnect)//if window closed disconnect should run which will decrease the clients
})

function Disconnect() {
    if (clients > 0) {
        if (clients <= 2)
            this.broadcast.emit("Disconnect")
        clients--
    }
}

function makeOffer(offer) {
    this.broadcast.emit("backOffer", offer)//sends the offer to all other clients and not us while offer
}

function sendAnswer(data) {
    this.broadcast.emit("backAns", data)//data(ans) to the other user sent
}

http.listen(port,function(){
    console.log(`Port started at ${port} port`);
});//for port to start at available port or by default local host:3000