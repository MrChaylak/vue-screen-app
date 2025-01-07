<template>
    <div>
      <h2>Vue App (App1)</h2>
      <p>Status: {{ status }}</p>
      <button @click="sendMessage">Send Message to App2</button>
    </div>
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
      this.socket = io("http://localhost:8080");
  
      this.socket.on("connect", () => {
        this.status = "Connected";
        console.log("Vue App (App1) connected to server");
        this.socket.emit("register", { name: "App1" });
      });
  
      this.socket.on("client_list", (clients) => {
        console.log("Connected clients:", clients);
      });
  
      this.socket.on("signaling_message", (data) => {
        console.log(`Received message from ${data.from}:`, data.message);
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
  