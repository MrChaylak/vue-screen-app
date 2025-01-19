<template>
    <v-card class="pa-4 pt-0">
      <v-card-text>
        <v-container>
          <v-row align="center">
            <v-col cols="auto">
              <!-- Single Toggle Button -->
              <v-btn
                @click="toggleScreenShare"
                :color="isScreenSharing ? 'error' : 'success'"
                class="mt-2"
              >
              <v-icon>{{ isScreenSharing ? 'mdi-monitor-off' : 'mdi-monitor-share' }}</v-icon>
              &nbsp;{{ isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share' }}
              </v-btn>
              <v-btn icon @click="toggleTheme" class="mx-3">
          <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
        </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-responsive>
            <div style="position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden;">
                <video
                id="remote-desktop-video"
                autoplay
                playsinline
                tabindex="0"
                style="position: absolute; margin-top: 0; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; border: 1px solid #ccc; cursor: crosshair;"
                ></video>
            </div>
        </v-responsive>
      </v-card-actions>
  
      <!-- Screen Selection Dialog -->
      <v-dialog v-model="screenSelectionDialog" max-width="800">
        <v-card>
          <v-card-title>Select a Screen</v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <!-- Display screen options with thumbnails -->
                <v-col
                  v-for="screen in screens"
                  :key="screen.id"
                  cols="12"
                  md="4"
                >
                  <v-card @click="selectScreen(screen)" class="screen-option">
                    <v-img :src="screen.thumbnail" aspect-ratio="16/9" cover></v-img>
                    <v-card-title class="text-center">{{ screen.name }}</v-card-title>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="closeScreenSelectionDialog" color="primary">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </template>
  
  <script lang="ts">
  import { useTheme } from 'vuetify';
  import { defineComponent, nextTick, onMounted, ref, onUnmounted, computed } from "vue";
  import { WebRTCClient } from "@/service/signaling";
  
  export default defineComponent({
    name: "RemoteDesktopComponent",
    setup() {
      const webrtcClient = ref<WebRTCClient | null>(null);
      const screens = ref<Array<{ id: string; name: string; thumbnail: string }>>([]);
      const selectedScreen = ref<string>("");
      const videoElement = ref<HTMLVideoElement | null>(null);
      const isScreenSharing = ref(false); // Track screen share status
      const sharedScreen = ref<string>("");
      const screenSelectionDialog = ref(false); // Control dialog visibility
      let screenListInterval: number | null = null; // Store the interval ID     
      const theme = useTheme();

    // Computed to know if the current theme is dark
    const isDarkTheme = computed(() => theme.global.current.value.dark);

    const toggleTheme = () => {
      // Toggle between light and dark themes
      theme.global.name.value = isDarkTheme.value ? 'light' : 'dark';
    };

      const getScreenList = () => {
        webrtcClient.value?.requestScreenList();
      };
  
      const startScreenShare = () => {
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
          openScreenSelectionDialog();
        }
      };
  
      const openScreenSelectionDialog = () => {
        screenSelectionDialog.value = true;
        getScreenList(); // Fetch the latest screen list when the dialog is opened
      };
  
      const closeScreenSelectionDialog = () => {
        screenSelectionDialog.value = false;
      };
  
      const selectScreen = (screen: { id: string; name: string; thumbnail: string }) => {
        selectedScreen.value = screen.id;
        closeScreenSelectionDialog(); // Close the dialog after selection
        startScreenShare(); // Automatically start screen sharing after selecting a screen
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
            thumbnail: screen.thumbnail, // Ensure the thumbnail is included
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
        screenSelectionDialog,
        openScreenSelectionDialog,
        closeScreenSelectionDialog,
        selectScreen,
        theme,
        toggleTheme,
        isDarkTheme
      };
    },
  });
  </script>
  
  <style>
  .screen-option {
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .screen-option:hover {
    transform: scale(1.05);
  }
  </style>