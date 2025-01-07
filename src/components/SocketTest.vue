<template>
    <div>
      <button @click="testConnectivity">Test Server Connectivity</button>
      <p>{{ serverResponse }}</p>
    </div>
  </template>
  
  <script>
  import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

// Handle connection
socket.on("connect", () => {
  console.log("Connected to signaling server");
  // Send an identification message
  socket.emit("identify_client", { clientType: "Vue.js App" });
});

// Handle server's identify event
socket.on("identify", (data) => {
  console.log("Server asks for identity:", data.message);
  socket.emit("identify_client", { clientType: "Vue.js App" });
});

export default socket;

  </script>
  