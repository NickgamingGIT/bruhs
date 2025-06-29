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
        io.emit("join", {username, id: socket.id});
        io.emit("message", `${users[socket.id]} has joined`);
    });
    socket.on("message", message => {
        io.emit("message", `${users[socket.id]}: ${message}`);
    });
    socket.on("disconnect", () => {
        io.emit("message", `${users[socket.id]} has left`);
    });
});

server.listen(3000, () => {
    console.log("server started ig");
});