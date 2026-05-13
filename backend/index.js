const { app } = require("./config/app");
const http = require("http");
const PORT = process.env.PORT || 8811;
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let onlineUsers = {};
io.on("connection", (socket) => {
  let userId;
  socket.on("join", (params) => {
    userId = params?.id;
    if (userId) {
      socket.join(params?.id);
      onlineUsers[userId] = socket.id;
      io.emit("online-users", Object.keys(onlineUsers));
      console.log(`Online users count ${Object.keys(onlineUsers).length}`);
    }
  });

  socket.on("disconnect", () => {
    delete onlineUsers[userId];
    io.emit("online-users", Object.keys(onlineUsers));
    console.log(`Online users count ${Object.keys(onlineUsers).length}`);
  });
});

app.io = io;
app.onlineUsers = onlineUsers;

server.listen(PORT, () => console.log(`Backend server is running on the port: ${PORT}`));