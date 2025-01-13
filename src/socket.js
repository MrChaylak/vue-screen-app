// socket.js

import { io } from 'socket.io-client';

// The URL should match your server’s URL and port
const socket = io('http://localhost:3000', {
  reconnectionAttempts: 5, // example configuration
  reconnectionDelay: 2000  // example configuration
});

// Log whenever we connect or disconnect
socket.on('connect', () => {
  console.log('Vue app connected to server with socket id: ', socket.id);
});

socket.on('disconnect', () => {
  console.log('Vue app disconnected from server');
});

// Optionally listen for a broadcast event
socket.on('broadcast-event', (data) => {
  console.log('Received broadcast-event from server:', data);
});

socket.on('broadcast-event', (data) => {
    console.log('Received broadcast-event:', data);
});

export default socket;
