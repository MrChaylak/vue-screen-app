<template>
    <v-card class="pa-4">
      <v-card-text>
        <v-container>
          <v-row align="center">
            <v-col cols="auto">
              <v-select
                v-model="selectedCamera"
                :items="cameras"
                item-title="label"
                item-value="deviceId"
                label="Select a Camera"
                style="width: 150px;"
              ></v-select>
            </v-col>
            <v-col cols="auto" class="pt-0">
              <!-- Single Toggle Button -->
              <v-btn
                @click="toggleCamera"
                :color="isCameraSharing ? 'error' : 'success'"
                class="mt-2 mt-md-0"
              >
                <v-icon>{{ isCameraSharing ? 'mdi-camera-off' : 'mdi-camera' }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-responsive>
          <video id="camera-video" autoplay playsinline style="width: 100%; border: 1px solid #ccc;"></video>
        </v-responsive>
      </v-card-actions>
    </v-card>
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted, ref, onUnmounted } from 'vue';
  import { WebRTCClient } from "@/service/signaling";
  import { nextTick } from 'vue';
  
  export default defineComponent({
    name: 'CameraComponent',
    setup() {
      const webrtcClient = ref<WebRTCClient | null>(null);
      const cameras = ref<Array<{ deviceId: string; label: string }>>([]);
      const selectedCamera = ref<string>('');
      const videoElement = ref<HTMLVideoElement | null>(null);
      const sharedCamera = ref<string>('');
      const isCameraSharing = ref(false);
      let cameraListInterval: number | null = null; // Store the interval ID
  
      const getCameraList = () => {
        webrtcClient.value?.requestCameraList();
      };
  
      const startCamera = () => {
        if (isCameraSharing.value && sharedCamera.value !== selectedCamera.value) {
          stopCamera();
        } else if (isCameraSharing.value && sharedCamera.value === selectedCamera.value) {
          return;
        }
        if (selectedCamera.value) {
          webrtcClient.value?.startCamera(selectedCamera.value);
          sharedCamera.value = selectedCamera.value;
          isCameraSharing.value = true;
        } else {
          alert('Please select a camera');
        }
      };
  
      const stopCamera = () => {
        webrtcClient.value?.stopCamera();
        if (videoElement.value && videoElement.value.srcObject) {
          (videoElement.value.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
          videoElement.value.srcObject = null;
        }
        isCameraSharing.value = false;
      };
  
      const toggleCamera = () => {
        if (isCameraSharing.value) {
          stopCamera();
        } else {
          startCamera();
        }
      };
  
      onMounted(() => {
        videoElement.value = document.getElementById('camera-video') as HTMLVideoElement;
  
        if (!videoElement.value) {
          console.error('Video element for camera not found');
        }
  
        webrtcClient.value = new WebRTCClient('ws://localhost:8080', 'camera');
  
        // Set the callback for camera stream
        webrtcClient.value.onRemoteStream = ((stream: MediaStream) => {
          console.log('Remote stream received for camera:', stream);
          nextTick(() => {
            if (videoElement.value) {
              videoElement.value.srcObject = stream;
              videoElement.value.play().catch((err) =>
                console.error('Error playing camera video:', err)
              );
            }
          });
        });
  
        // Set the callback for receiving the camera list
        webrtcClient.value.onCameraList = (cameraList) => {
          cameras.value = cameraList.map((camera) => ({
            label: camera.label || `Camera ${camera.deviceId}`,
            deviceId: camera.deviceId,
          }));
        };
  
        // Start fetching the camera list every 5 seconds
        cameraListInterval = setInterval(getCameraList, 5000);
      });
  
      // Clear the interval when the component is unmounted
      onUnmounted(() => {
        if (cameraListInterval) {
          clearInterval(cameraListInterval);
        }
      });
  
      return {
        getCameraList,
        startCamera,
        stopCamera,
        toggleCamera,
        cameras,
        selectedCamera,
        videoElement,
        isCameraSharing,
        sharedCamera,
      };
    },
  });
  </script>
  
  <style>
  video {
    width: 100%;
    border: 1px solid #ccc;
    margin-top: 20px;
  }
  </style>