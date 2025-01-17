<template>
  <v-app>
    <v-main>
      <!-- Signal Client -->
      <!-- <SignalClient /> -->

      <ScreenContent :isCameraRunning="isCameraRunning" :currentStream="currentStream" :screenSources="screenSources"
        :showScreenDialog="showScreenDialog" :screenStream="screenStream"
        @update:showScreenDialog="value => showScreenDialog = value" @startScreenShare="startScreenShare" />
    </v-main>

    <!-- Bottom Bar for Controls -->
    <BottomBar :participantCount="0" :cameraOptions="cameras" :selectedCameraId="selectedCameraId"
      :isScreenSharing="!!screenStream" :isConnected="isConnected" @connect="handleConnect"
      @toggle-camera="toggleCamera" @update-camera="updateSelectedCamera" @share-screen="showScreenSelection"
      @stop-screen-share="stopScreenShare" />
  </v-app>
</template>

<script>
import SignalClient from "./components/SignalClient.vue";
import BottomBar from "./components/BottomBar.vue";
import ScreenContent from "./components/ScreenContent.vue";
import { io } from "socket.io-client";

export default {
  name: "App",
  components: { SignalClient, BottomBar, ScreenContent },
  data() {
    return {
      cameras: [], // List of camera options
      selectedCameraId: null,
      isCameraRunning: false,
      currentStream: null,
      screenStream: null,
      screenSources: [],
      showScreenDialog: false,
      socket: null,
      isConnected: false,
      peerConnection: null,
      dataChannel: null,
    };
  },
  methods: {
    async handleConnect() {
      console.log("Connect button clicked");

      if (this.socket && this.socket.connected) {
        // Disconnect if already connected
        console.log("Disconnecting socket:", this.socket.id);
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      } else {
        // Create a new socket connection
        this.socket = io("http://localhost:8181", {
          auth: {
            userName: "vue",
            password: "x",
          },
        });

        // Set up WebRTC
        await this.setupWebRTC();

        // Handle socket events
        this.socket.on("connect", () => {
          console.log("Vue connected to server with ID:", this.socket.id);
          this.isConnected = true;
        });

        this.socket.on("answerResponse", async (answer) => {
          console.log("Answer received from server:", answer);
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        });

        this.socket.on("iceCandidate", (data) => {
          const { candidate, didIOffer } = data;
          if (!didIOffer) { // Only add if the candidate is from the answerer
            console.log("Received ICE candidate from answerer:", candidate);
            this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        this.socket.on("disconnect", () => {
          console.log("Socket disconnected");
          this.isConnected = false;
        });
      }
    },

    async setupWebRTC() {
      // Create a new RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      this.peerConnection.addTransceiver("video", { direction: "sendrecv" });
      //peerconnection on open event listenerı ekle
      this.peerConnection.ontrack = (event) => {
        console.log("Remote track added:", event.streams[0]);

        this.currentStream = event.streams[0];
        this.isCameraRunning = true;
        console.log("Remote stream added:", event.streams[0]);

      };


      // Set up a data channel
      this.dataChannel = this.peerConnection.createDataChannel("chat");
      this.dataChannel.onopen = () => {
        console.log("Data channel opened!");
        // this.dataChannel.send("Hello from Vue!");
      };

      this.dataChannel.onmessage = (event) => {
        console.log("Message received:", event.data);

        // Parse the received message
        const message = JSON.parse(event.data);
        if (message.type === "cameraOptions") {
          console.log("Received camera options:", message.cameras);
          this.cameras = message.cameras; // Update the camera list
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          this.socket.emit("iceCandidate", {
            candidate: event.candidate,
            userName: "vue",
            didIOffer: true, // Indicates this candidate is from the offerer
          });
        }
      };




      // Create an offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("Offer created:", offer);

      // Send the offer to the server
      this.socket.emit("newOffer", {
        type: offer.type, // Ensure the type is included
        sdp: offer.sdp,   // Include the SDP
      });
    },
    updateSelectedCamera(deviceId) {
      this.selectedCameraId = deviceId;
      console.log("Selected camera updated:", deviceId);
    },
    toggleCamera(isOn, selectedDeviceId) {
      if (isOn) {
        if (this.dataChannel && this.dataChannel.readyState === "open") {
          console.log("Sending selected camera to Electron:", selectedDeviceId);
          this.dataChannel.send(JSON.stringify({ type: "selectedCamera", selectedDeviceId }));
        } else {
          console.warn("Data channel is not open. Cannot send selected camera.");
        }
      } else {
        // this.stopWebcam();
        // this.currentStream.getTracks().forEach(track => track.stop());
        // this.currentStream = null;
        // this.isCameraRunning = false;
      }
    },
  },
};
</script>
