<template>
  <!-- <div>
      <h2>Vue App (App1)</h2>
      <p>Status: {{ status }}</p>
      <button @click="sendMessage">Send Message to App2</button>
    </div> -->
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      status: "Disconnected",
      socket: null,
    };
  },
  mounted() {
    // Connect to the signaling server
    const socket = io("http://localhost:8181", {
      auth: {
        userName: "vue",
        password: "x", // Make sure this matches the server's requirement
      },
    });

    // Log connection status
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
    });

    // Log messages received from the server
    socket.on("message", (data) => {
      console.log("Received message from server:", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  },
  methods: {
    sendMessage() {
      this.socket.emit("signaling_message", {
        target: "App2",
        message: "Hello from Vue App (App1)!",
      });
    },
  },
};
</script>

<style>
h2 {
  color: #42b983;
}
</style>