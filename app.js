const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize chess game
const chess = new Chess();
const players = { };
let currentPlayer = 'w';

// Configure Express
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Route for root URL
app.get('/', (req, res) => {
  res.render('index', { title: 'Custom Chess Game' });
});

// Socket.io connection handling
io.on('connection', function(uniqueCocket)    {
  console.log('A user connected');
 if (!players.white){
   players.white = uniqueCocket.id;
   uniqueCocket.emit("playerRole", "w");
 }
 else if (!players.black){
   players.black = uniqueCocket.id;
   uniqueCocket.emit("playerRole", "b");
 }
 else {
   uniqueCocket.emit("spectatorRole");
 }
  uniqueCocket.on('disconnect', function() {
    if (players.white === uniqueCocket.id){
    //   players.white = null;
      delete players.white
    }
    else if (players.black === uniqueCocket.id){
    //   players.black = null;
    delete players.black
    }
    console.log('A user disconnected');  
  });


  uniqueCocket.on('move', (move)=> {
    try{
        if (chess.turn() === 'w' && uniqueCocket.id !== players.white) return 
        if (chess.turn() === 'b' && uniqueCocket.id !== players.black) return
        else{
          const result = chess.move(move);
          if (result) {
            currentPlayer = chess.turn();
            io.emit('move', move);
            io.emit('boardState', chess.fen());
          }
          else {
            uniqueCocket.emit("invalidMove", move);
          }
    }
}
    catch(e){
      console.log(e);
      uniqueCocket.emit("invalidMove", move);
    }
}
  );
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});