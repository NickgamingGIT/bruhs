const socket = io();

function join() {
    document.getElementById("joinscreen").style.visibility = "hidden";
    document.getElementById("chatscreen").style.visibility = "visible";
    socket.emit("join", document.getElementById("username").value);
};

document.getElementById("send").onclick = () => {
    socket.emit("message", document.getElementById("input").value);
};

socket.on("message", message => {
    document.getElementById("chat").innerText += `\n${message}`;
});