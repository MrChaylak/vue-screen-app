<template>
  <v-app>
    <v-main>
      <!-- Signal Client -->
      <SignalClient />

      <ScreenContent 
        :isCameraRunning="isCameraRunning" 
        :currentStream="currentStream" 
        :screenSources="screenSources"
        :showScreenDialog="showScreenDialog"
        :screenStream="screenStream"
        @update:showScreenDialog="value => showScreenDialog = value"
        @startScreenShare="startScreenShare" />
    </v-main>

    <!-- Bottom Bar for Controls -->
    <BottomBar :participantCount="0" :cameraOptions="cameras" :selectedCameraId="selectedCameraId"
      :isScreenSharing="!!screenStream" @toggle-camera="toggleCamera" @update-camera="updateSelectedCamera"
      @share-screen="showScreenSelection" @stop-screen-share="stopScreenShare" />
  </v-app>
</template>

<script>
import SignalClient from "./components/SignalClient.vue";
import BottomBar from "./components/BottomBar.vue";
import ScreenContent from "./components/ScreenContent.vue";

export default {
  name: "App",
  components: { SignalClient, BottomBar, ScreenContent },
  data() {
    return {
      cameras: [],
      selectedCameraId: null,
      isCameraRunning: false,
      currentStream: null,
      screenStream: null,
      screenSources: [],
      showScreenDialog: false,
    };
  },
  methods: {
    async getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.cameras = devices
          .filter(device => device.kind === "videoinput")
          .map((device, index) => ({
            label: device.label || `Camera ${index + 1}`,
            deviceId: device.deviceId,
          }));
        if (this.cameras.length > 0) {
          this.selectedCameraId = this.cameras[0].deviceId;
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
      }
    },
    async showScreenSelection() {
      // try {
      //   const sources = await window.electron.getSources();
      //   this.screenSources = sources.map(source => ({
      //     id: source.id,
      //     name: source.name,
      //     thumbnail: source.thumbnail.toDataURL(),
      //   }));
      //   this.showScreenDialog = true;
      // } catch (error) {
      //   console.error("Error fetching screens:", error);
      // }
      this.screenSources = [
        { id: "1", name: "Screen 1", thumbnail: "example1.jpg" },
        { id: "2", name: "Screen 2", thumbnail: "example2.jpg" },
      ];
      console.log('showScreenSelection called');
      this.showScreenDialog = true;
    },
    async startScreenShare(source) {
      try {
        this.showScreenDialog = false;

        const constraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id,
            },
          },
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
    async startWebcam(deviceId) {
      if (this.currentStream) {
        this.stopWebcam();
      }
      try {
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
          },
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
  },
  mounted() {
    this.getCameras();
  },
};
</script>
