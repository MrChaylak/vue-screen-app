<template>
  <div>
    <h1>Vue + Socket.IO</h1>
    <button @click="sendMessage">Send Message to Server</button>
  </div>
</template>

<script>
import socket from '@/socket';

export default {
  name: 'App',
  methods: {
    sendMessage() {
      socket.emit('custom-event', { msg: 'Hello from Vue!' });
    }
  }
}
</script>
