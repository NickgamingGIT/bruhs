import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";

const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.static("public"));

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
