<template>
  <v-app>
    <v-main>
      <div class="screen-container border-md">
        <!-- <SocketTest /> -->
        <SignalClient />
        <!-- Screen Share Display -->
        <div class="screen-share-display ">
          <video 
            ref="screenVideo" 
            autoplay 
            playsinline 
            style="width: 100%; height: 100%; background-color: #000;">
          </video>
        </div>

        <!-- Camera Feed Display (Floating on Top of the Screen Share) -->
        <div v-if="isCameraRunning" class="camera-feed">
          <CameraDisplay :stream="currentStream" />
        </div>
      </div>
    </v-main>

    <!-- Bottom Bar for Controls -->
    <BottomBar
      :participantCount="0"
      :cameraOptions="cameras"
      :selectedCameraId="selectedCameraId"
      :isScreenSharing="!!screenStream"
      @toggle-camera="toggleCamera"
      @update-camera="updateSelectedCamera"
      @share-screen="showScreenSelection"
      @stop-screen-share="stopScreenShare"
    />

    <!-- Screen Selection Dialog -->
    <v-dialog v-model="showScreenDialog" max-width="600px">
      <v-card>
        <v-card-title>Select a screen to share</v-card-title>
        <v-card-text>
          <v-row>
            <v-col 
              v-for="source in screenSources" 
              :key="source.id" 
              cols="6" 
              class="screen-option"
            >
              <v-img 
                :src="source.thumbnail" 
                aspect-ratio="16/9" 
                @click="startScreenShare(source)"
                class="screen-thumbnail"
              />
              <p class="text-center">{{ source.name }}</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showScreenDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import CameraDisplay from "./components/CameraDisplay.vue";
import BottomBar from "./components/BottomBar.vue";
import SignalClient from "./components/SignalClient.vue";

export default {
  name: "App",
  components: { CameraDisplay, BottomBar, SignalClient },
  data() {
    return {
      cameras: [],
      selectedCameraId: null,
      isCameraRunning: false,
      currentStream: null,
      screenStream: null,
      screenSources: [], // Screens and windows to select from
      showScreenDialog: false, // Controls the screen selection dialog
    };
  },
  methods: {
    async getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map((device, index) => ({
            label: device.label || `Camera ${index + 1}`,
            deviceId: device.deviceId
          }));
        if (this.cameras.length > 0) {
          this.selectedCameraId = this.cameras[0].deviceId;
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
      }
    },
    async startWebcam(deviceId) {
      if (this.currentStream) {
        this.stopWebcam();
      }
      try {
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.currentStream = stream;
        this.isCameraRunning = true;
      } catch (error) {
        console.error("Error starting webcam:", error);
      }
    },
    stopWebcam() {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
        this.isCameraRunning = false;
      }
    },
    toggleCamera(isOn, selectedDeviceId) {
      if (isOn) {
        this.startWebcam(selectedDeviceId || this.selectedCameraId);
      } else {
        this.stopWebcam();
      }
    },
    updateSelectedCamera(deviceId) {
      this.selectedCameraId = deviceId;
    },
    async showScreenSelection() {
      try {
        const sources = await window.electron.getSources();
        this.screenSources = sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL()
        }));
        this.showScreenDialog = true;
      } catch (error) {
        console.error("Error fetching screens:", error);
      }
    },
    async startScreenShare(source) {
      try {
        this.showScreenDialog = false;

        const constraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id
            }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.screenStream = stream;

        const videoElement = this.$refs.screenVideo;
        videoElement.srcObject = stream;

      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    },
    stopScreenShare() {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
      }
    }
  },
  mounted() {
    this.getCameras();
  }
};
</script>

<style scoped>
/* Screen container holds screen share and camera feed */
.screen-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 102px);
  border-radius: 8px;
  overflow: hidden;
}

/* Fullscreen for the screen share */
.screen-share-display {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
}

/* Camera feed as a floating window */
.camera-feed {
  position: absolute;
  top: 20px; /* Position relative to the screen video */
  right: 20px;
  width: 200px;
  height: 120px;
  background-color: #000;
  border: 2px solid #adadad;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Ensures camera feed is on top */
  overflow: hidden;
}

.screen-option {
  cursor: pointer;
}

.screen-thumbnail {
  border-radius: 8px;
  border: 2px solid #ccc;
}

.screen-thumbnail:hover {
  border-color: #3f51b5;
}
</style>
