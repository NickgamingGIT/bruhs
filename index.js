import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "https://cdchat.netlify.app",
    methods: ["GET", "POST"]
  }
});

const users = {};

io.on("connection", socket => {
  socket.on("join", username => {
    users[socket.id] = username;
    io.emit("join", { username, id: socket.id });
    io.emit("message", `${username} has joined`);
  });
  socket.on("message", message => {
    io.emit("message", `${users[socket.id]}: ${message}`);
  });
  socket.on("disconnect", () => {
    io.emit("message", `${users[socket.id]} has left`);
    delete users[socket.id];
  });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`server started ig, btw the port is ${PORT}`);
});
