<template>
  <v-card class="pa-4">
    <v-card-text class="pa-0">
      <v-container>
        <!-- Input Fields and Button -->
        <v-row align="center">
          <v-col cols="auto">
            <v-select v-model="selectedOnvifCamera" :items="onvifCameras" item-title="ip" item-value="ip"
              label="Select a Camera" style="width: 15vw; min-width: 130px;"></v-select>
          </v-col>
          <v-col cols="auto">
            <v-text-field v-model="username" label="Username" style="width: 15vw; min-width: 130px;"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-text-field v-model="password" label="Password" type="password" style="width: 15vw; min-width: 130px;"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-btn @click="getOnvifCameraData" color="primary" style="width: 10vw; min-width: 90px;">Get Data</v-btn>
          </v-col>
        </v-row>

        <!-- Error Message -->
        <v-row v-if="errorMessage">
          <v-col>
            <v-alert type="error" dismissible @input="errorMessage = ''">
              {{ errorMessage }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Display ONVIF Camera Data -->
        <v-row v-if="cameraData">
          <v-col cols="8">
            <v-card class="mt-4">
              <v-card-title>ONVIF Camera Data</v-card-title>
              <v-card-text>

                <!-- Device Information -->
                <v-list>
                  <!-- Custom order for device_info -->
                  <template v-for="key in ['manufacturer', 'model', 'firmware_version', 'serial_number', 'hardware_id']"
                    :key="`device_info-${key}`">
                    <v-list-item v-if="cameraData.device_info[key]">
                      <v-list-item-title>{{ formatKey(key) }}</v-list-item-title>
                      <v-list-item-subtitle>{{ cameraData.device_info[key] }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>

                  <!-- Additional fields outside device_info -->
                  <template v-for="(value, key) in cameraData" :key="key">
                    <template v-if="(key as unknown) !== 'device_info' && (key as unknown) !== 'profiles'">
                      <v-list-item>
                        <v-list-item-title>{{ formatKey(key) }}</v-list-item-title>
                        <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </template>
                </v-list>

                <!-- Media Profiles -->
                <v-expansion-panels class="mt-4">
                  <v-expansion-panel v-for="(profile, index) in cameraData.profiles" :key="index">
                    <v-expansion-panel-title>
                      <span class="mr-2">Profile {{ index + 1 }}</span>
                      <v-btn v-if="selectedProfileToken === profile.token" icon color="primary" size="x-small"
                        @click.stop="selectProfile(profile.token)">
                        <v-icon>mdi-check</v-icon>
                      </v-btn>
                      <v-btn v-else icon size="x-small" @click.stop="selectProfile(profile.token)">
                        <v-icon>mdi-checkbox-blank-outline</v-icon>
                      </v-btn>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list>
                        <!-- Loop through profile data -->
                        <template v-for="(value, key) in profile" :key="key">
                          <v-list-item>
                            <v-list-item-title>{{ formatKey(key) }}</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ value }}
                              <!-- Add units for specific fields -->
                              <span v-if="(key as unknown) === 'frame_rate'"> fps</span>
                              <span v-if="(key as unknown) === 'bitrate'"> kbps</span>
                            </v-list-item-subtitle>
                          </v-list-item>
                        </template>
                      </v-list>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="4">

            <!-- PTZ Controls -->
            <v-card class="mt-4" v-if="cameraData.ptz_available">
              <v-card-title>PTZ Controls</v-card-title>
              <v-card-text>
                <v-container class="ptz-controls pr-0 pl-0">
                  <!-- Grid Container -->
                  <div class="ptz-grid">
                    <!-- PTZ Buttons -->
                    <template v-for="(button, index) in ptzButtons" :key="`ptz-button-${index}`">
                      <v-btn icon class="ptz-button" @mousedown="startContinuousMove(...button.params)"
                        @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                        <v-icon>{{ button.icon }}</v-icon>
                      </v-btn>
                    </template>

                    <!-- Center Button -->
                    <v-btn icon class="ptz-button center-button" @click="ptzStop">
                      <v-icon>mdi-circle</v-icon>
                    </v-btn>
                  </div>

                  <!-- Speed Control -->
                  <v-row class="mt-4" align="center">
                    <v-col cols="auto">
                      <span class="text-body-1">Speed (1-8):</span>
                    </v-col>
                    <v-col cols="auto" class="pa-0">
                      <v-select v-model="ptzSpeed" :items="[1, 2, 3, 4, 5, 6, 7, 8]" density="compact"
                        style="width: 10vw; min-width: 75px;"></v-select>
                    </v-col>
                  </v-row>

                  <!-- Zoom Control -->
                  <v-row class="mt-4" align="center" justify="center">
                    <template v-for="(button, index) in zoomButtons" :key="`zoom-button-${index}`">
                      <v-col cols="auto" :class="{ 'pa-0': button.icon === 'mdi-minus' || button.icon === 'mdi-plus' }">
                        <v-btn icon class="zoom-button" @mousedown="startContinuousMove(0, 0, button.zoomDirection)"
                          @mouseup="ptzStop" @mouseleave="ptzStop">
                          <v-icon>{{ button.icon }}</v-icon>
                        </v-btn>
                      </v-col>
                      <!-- Add the Zoom Label only once -->
                      <v-col v-if="index === 0" cols="auto">
                        <span class="text-body-1">Zoom</span>
                      </v-col>
                    </template>
                  </v-row>
                  <!-- Focus Control -->
                  <v-row class="mt-4" align="center" justify="center">
                    <template v-for="(button, index) in focusButtons" :key="`focus-button-${index}`">
                      <v-col cols="auto" :class="{ 'pa-0': button.icon === 'mdi-minus' || button.icon === 'mdi-plus' }">
                        <v-btn icon class="focus-button" @mousedown="startFocusContinuous(button.focusDirection)"
                          @mouseup="stopFocus" @mouseleave="stopFocus">
                          <v-icon>{{ button.icon }}</v-icon>
                        </v-btn>
                      </v-col>
                      <!-- Add the Focus Label only once -->
                      <v-col v-if="index === 0" cols="auto">
                        <span class="text-body-1">Focus</span>
                      </v-col>
                    </template>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import { FlaskClient } from '@/service/flask';
import { nextTick } from 'vue';

export default {
  name: 'OnvifCameraComponent',
  setup() {
    const flaskClient = ref<FlaskClient | null>(null);
    const onvifCameras = ref<Array<{ ip: string; }>>([]);
    const selectedOnvifCamera = ref<string>('');
    const username = ref<string>('');
    const password = ref<string>('');
    const cameraData = ref<any>(null);
    const errorMessage = ref<string>('');
    const selectedProfileToken = ref<string>('');
    let onvifCameraListInterval: number | null = null;
    const streamUri = ref<string>('');
    const isMoving = ref(false);
    const ptzSpeed = ref(5); // Default speed is 5
    const ptzButtons: { icon: string; params: [number, number, number] }[] = [
      { icon: "mdi-arrow-top-left", params: [-1, 1, 0] },
      { icon: "mdi-arrow-up", params: [0, 1, 0] },
      { icon: "mdi-arrow-top-right", params: [1, 1, 0] },
      { icon: "mdi-arrow-left", params: [-1, 0, 0] },
      { icon: "mdi-arrow-right", params: [1, 0, 0] },
      { icon: "mdi-arrow-bottom-left", params: [-1, -1, 0] },
      { icon: "mdi-arrow-down", params: [0, -1, 0] },
      { icon: "mdi-arrow-bottom-right", params: [1, -1, 0] },
    ];
    const zoomButtons = [
      { icon: "mdi-minus", zoomDirection: -1 }, // Zoom out
      { icon: "mdi-plus", zoomDirection: 1 },   // Zoom in
    ];
    const focusButtons = [
      { icon: "mdi-minus", focusDirection: -0.5 }, // Decrease focus
      { icon: "mdi-plus", focusDirection: 0.5 },   // Increase focus
    ];


    const getOnvifCameraList = async () => {
      try {
        if (flaskClient.value) {
          const response = await flaskClient.value.getOnvifCameraList();
          onvifCameras.value = response.devices.map((ip: string) => ({ ip }));
        }
      } catch (error) {
        console.error('Failed to fetch ONVIF cameras:', error);
      }
    };


    const getOnvifCameraData = async () => {
      try {
        if (flaskClient.value) {
          const data = await flaskClient.value.getOnvifCameraData(
            selectedOnvifCamera.value,
            username.value,
            password.value
          );
          cameraData.value = data;
          errorMessage.value = '';

          if (data.profiles.length > 0) {
            selectedProfileToken.value = data.profiles[0].token;
          }
        }
      } catch (error: any) {
        errorMessage.value = error;
        // console.error(error);
      }
    };


    const selectProfile = async (token: string) => {
      try {
        if (flaskClient.value) {
          const response = await flaskClient.value.setOnvifCameraProfile(
            selectedOnvifCamera.value,
            username.value,
            password.value,
            token
          );
          // Update the selected profile token and stream URI
          selectedProfileToken.value = token;
          console.log('Selected profile token:', token);
          console.log('Stream URI:', response.stream_uri);
          streamUri.value = response.stream_uri;
          // You can now use the stream URI to display the video stream
          // For example, pass it to a video player component

        } else {
          console.error('FlaskClient is not initialized.');
        }
      } catch (error) {
        console.error('Failed to set ONVIF camera profile:', error);
      }
    };


    // Start continuous movement
    const startContinuousMove = async (panSpeed: number, tiltSpeed: number, zoomSpeed: number) => {
      isMoving.value = true;
      const adjustedPanSpeed = panSpeed * (ptzSpeed.value / 8);
      const adjustedTiltSpeed = tiltSpeed * (ptzSpeed.value / 8);
      const adjustedZoomSpeed = zoomSpeed;
      try {
        if (flaskClient.value && selectedProfileToken.value) {
          await flaskClient.value.ptzMove(
            selectedOnvifCamera.value,
            username.value,
            password.value,
            selectedProfileToken.value,
            adjustedPanSpeed,
            adjustedTiltSpeed,
            adjustedZoomSpeed,
          );
        }
      } catch (error) {
        console.error('Failed to perform PTZ movement:', error);
      }
    };


    // Stop continuous movement
    const stopContinuousMove = async () => {
      if (isMoving.value) {
        isMoving.value = false;
        try {
          if (flaskClient.value && selectedProfileToken.value) {
            await flaskClient.value.ptzStop(
              selectedOnvifCamera.value,
              username.value,
              password.value,
              selectedProfileToken.value
            );
          }
        } catch (error) {
          console.error('Failed to stop PTZ movement:', error);
        }
      }
    };


    // Fixed movement on click
    const ptzMove = async (panSpeed: number, tiltSpeed: number) => {
      try {
        if (flaskClient.value && selectedProfileToken.value) {
          await flaskClient.value.ptzMove(
            selectedOnvifCamera.value,
            username.value,
            password.value,
            selectedProfileToken.value,
            panSpeed,
            tiltSpeed,
            0 // Zoom speed (0 for no zoom)
          );

          // Stop after a short delay (e.g., 200ms)
          setTimeout(() => {
            flaskClient.value?.ptzStop(
              selectedOnvifCamera.value,
              username.value,
              password.value,
              selectedProfileToken.value
            );
          }, 200);
        }
      } catch (error) {
        console.error('Failed to perform PTZ movement:', error);
      }
    };


    const ptzStop = async () => {
      try {
        if (flaskClient.value && selectedProfileToken.value) {
          await flaskClient.value.ptzStop(
            selectedOnvifCamera.value,
            username.value,
            password.value,
            selectedProfileToken.value
          );
        }
      } catch (error) {
        console.error('Failed to stop PTZ movement:', error);
      }
    };


    // Start continuous focus adjustment

    const startFocusContinuous = async (speed: number) => {
      try {
        if (flaskClient.value && selectedProfileToken.value) {
          await flaskClient.value.moveFocusContinuous(
            selectedOnvifCamera.value,
            username.value,
            password.value,
            selectedProfileToken.value,
            speed
          );
        }
      } catch (error) {
        console.error('Error starting continuous focus:', error);
      }
    };


    // Stop focus adjustment

    const stopFocus = async () => {

      try {
        if (flaskClient.value && selectedProfileToken.value) {
          await flaskClient.value.stopFocus(
            selectedOnvifCamera.value,
            username.value,
            password.value,
            selectedProfileToken.value
          );
        }
      } catch (error) {
        console.error('Error stopping focus:', error);
      }
    };


    const formatKey = (key: string | number): string => {
      // Ensure the key is treated as a string
      const keyString = String(key);

      return keyString
        .split("_")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };


    onMounted(() => {
      flaskClient.value = new FlaskClient('http://127.0.0.1:5000');
      getOnvifCameraList();

      onvifCameraListInterval = setInterval(getOnvifCameraList, 60000);
    });


    // Clear the interval when the component is unmounted
    onUnmounted(() => {
      if (onvifCameraListInterval) {
        clearInterval(onvifCameraListInterval);
      }

    });


    return {
      getOnvifCameraList,
      getOnvifCameraData,
      selectProfile,
      startContinuousMove,
      stopContinuousMove,
      ptzMove,
      ptzStop,
      startFocusContinuous,
      stopFocus,
      formatKey,
      onvifCameras,
      selectedOnvifCamera,
      username,
      password,
      cameraData,
      errorMessage,
      selectedProfileToken,
      ptzSpeed,
      ptzButtons,
      zoomButtons,
      focusButtons,
    };
  },
};
</script>

<style>
.ptz-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.ptz-button {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-button {
  width: 100%;
  height: 100%;
  grid-column: 2;
  /* Center column */
  grid-row: 2;
  /* Center row */
}
</style>