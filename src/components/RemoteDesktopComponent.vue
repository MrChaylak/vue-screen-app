<template>
    <v-card class="pa-4">
      <v-card-text>
        <v-container>
          <v-row align="center">
            <v-col cols="auto">
              <v-select
                v-model="selectedScreen"
                :items="screens"
                item-title="name"   
                item-value="id"
                label="Select a Screen"
                style="width: 800px;"
              ></v-select>
            </v-col>
            <v-col cols="auto">
              <!-- Single Toggle Button -->
              <v-btn
                @click="toggleScreenShare"
                :color="isScreenSharing ? 'error' : 'success'"
                class="mt-2"
              >
                <v-icon>{{ isScreenSharing ? 'mdi-monitor-off' : 'mdi-monitor-share' }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-responsive>
          <video
            id="remote-desktop-video"
            autoplay
            playsinline
            tabindex="0"
            style="width: 100%; border: 1px solid #ccc; cursor: crosshair;"
          ></video>
        </v-responsive>
      </v-card-actions>
    </v-card>
  </template>
  
  <script lang="ts">
  import { defineComponent, nextTick, onMounted, ref, onUnmounted } from "vue";
  import { WebRTCClient } from "@/service/signaling";
  
  export default defineComponent({
    name: "RemoteDesktopComponent",
    setup() {
      const webrtcClient = ref<WebRTCClient | null>(null);
      const screens = ref<Array<{ id: string; name: string }>>([]);
      const selectedScreen = ref<string>("");
      const videoElement = ref<HTMLVideoElement | null>(null);
      const isScreenSharing = ref(false); // Track screen share status
      const sharedScreen = ref<string>("");
      let screenListInterval: number | null = null; // Store the interval ID
  
      const getScreenList = () => {
        webrtcClient.value?.requestScreenList();
      };
  
      const startScreenShare = () => {
        if (isScreenSharing.value && sharedScreen.value !== selectedScreen.value) {
          stopScreenShare();
        } else if (isScreenSharing.value && sharedScreen.value === selectedScreen.value) {
          return;
        }
        if (selectedScreen.value) {
          webrtcClient.value?.startScreenShare(selectedScreen.value);
          isScreenSharing.value = true; // Mark screen share as active
          sharedScreen.value = selectedScreen.value;
        } else {
          alert("Please select a screen");
        }
      };
  
      const stopScreenShare = () => {
        webrtcClient.value?.stopScreenShare();
        isScreenSharing.value = false; // Mark screen share as inactive
        if (videoElement.value && videoElement.value.srcObject) {
          (videoElement.value.srcObject as MediaStream).getTracks().forEach((track) =>
            track.stop()
          );
          videoElement.value.srcObject = null;
        }
      };
  
      const toggleScreenShare = () => {
        if (isScreenSharing.value) {
          stopScreenShare();
        } else {
          startScreenShare();
        }
      };
  
      onMounted(() => {
        videoElement.value = document.getElementById("remote-desktop-video") as HTMLVideoElement;
  
        if (!videoElement.value) {
          console.error("Video element for screen share not found");
        }
  
        webrtcClient.value = new WebRTCClient("ws://localhost:8080", "screen");
  
        // Set the callback for screen share stream
        webrtcClient.value.onRemoteStream = (stream: MediaStream) => {
          console.log("Remote stream received for screen share:", stream);
          nextTick(() => {
            if (videoElement.value) {
              videoElement.value.srcObject = stream;
              videoElement.value.play().catch((err) =>
                console.error("Error playing screen share video:", err)
              );
            }
          });
        };
  
        // Set the callback for receiving the screen list
        webrtcClient.value.onScreenList = (screenList) => {
          screens.value = screenList.map((screen) => ({
            name: screen.name || `Screen ${screen.id}`,
            id: screen.id,
          }));
        };
  
        // Start fetching the screen list every 5 seconds
        screenListInterval = setInterval(getScreenList, 5000);
      });
  
      // Clear the interval when the component is unmounted
      onUnmounted(() => {
        if (screenListInterval) {
          clearInterval(screenListInterval);
        }
      });
  
      return {
        getScreenList,
        startScreenShare,
        stopScreenShare,
        toggleScreenShare,
        screens,
        selectedScreen,
        videoElement,
        isScreenSharing,
        sharedScreen,
      };
    },
  });
  </script>
  
  <style>
  video {
    width: 100%;
    border: 1px solid #ccc;
  }
  </style>