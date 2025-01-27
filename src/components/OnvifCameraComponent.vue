<template>
  <v-card class="pa-4">
    <v-card-text class="pa-0">
      <v-container>
        <!-- Input Fields and Button -->
        <v-row align="center">
          <v-col cols="auto">
            <v-select v-model="selectedOnvifCamera" :items="onvifCameras" item-title="ip" item-value="ip"
              label="Select a Camera" style="width: 200px;"></v-select>
          </v-col>
          <v-col cols="auto">
            <v-text-field v-model="username" label="Username" style="width: 200px;"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-text-field v-model="password" label="Password" type="password" style="width: 200px;"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-btn @click="getOnvifCameraData" color="primary">Get Data</v-btn>
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
                  <v-list-item>
                    <v-list-item-title>Manufacturer</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.device_info.manufacturer }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Model</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.device_info.model }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Firmware Version</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.device_info.firmware_version }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Serial Number</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.device_info.serial_number }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Hardware ID</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.device_info.hardware_id }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>PTZ Available</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.ptz_available }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Camera Running</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.camera_running }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>System Date and Time</v-list-item-title>
                    <v-list-item-subtitle>{{ cameraData.system_date_time }}</v-list-item-subtitle>
                  </v-list-item>
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
                        <v-list-item>
                          <v-list-item-title>Name</v-list-item-title>
                          <v-list-item-subtitle>{{ profile.name }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Token</v-list-item-title>
                          <v-list-item-subtitle>{{ profile.token }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Encoder</v-list-item-title>
                          <v-list-item-subtitle>{{ profile.encoder }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Resolution</v-list-item-title>
                          <v-list-item-subtitle>{{ profile.resolution }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Frame Rate</v-list-item-title>
                          <v-list-item-subtitle>{{ profile.frame_rate }} fps</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Bitrate</v-list-item-title>
                          <v-list-item-subtitle>{{ profile.bitrate }} kbps</v-list-item-subtitle>
                        </v-list-item>
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
                    <!-- Top Left Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(-1, 1, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-top-left</v-icon>
                    </v-btn>

                    <!-- Top Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(0, 1, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-up</v-icon>
                    </v-btn>

                    <!-- Top Right Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(1, 1, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-top-right</v-icon>
                    </v-btn>

                    <!-- Left Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(-1, 0, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>

                    <!-- Center Button -->
                    <v-btn icon class="ptz-button center-button" @click="ptzStop">
                      <v-icon>mdi-circle</v-icon>
                    </v-btn>

                    <!-- Right Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(1, 0, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-right</v-icon>
                    </v-btn>

                    <!-- Bottom Left Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(-1, -1, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-bottom-left</v-icon>
                    </v-btn>

                    <!-- Bottom Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(0, -1, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-down</v-icon>
                    </v-btn>

                    <!-- Bottom Right Button -->
                    <v-btn icon class="ptz-button" @mousedown="startContinuousMove(1, -1, 0)"
                      @mouseup="stopContinuousMove" @mouseleave="stopContinuousMove">
                      <v-icon>mdi-arrow-bottom-right</v-icon>
                    </v-btn>
                  </div>

                  <!-- Speed Control -->

                  <v-row class="mt-4" align="center">

                    <v-col cols="auto">

                      <span class="text-body-1">Speed (1-8):</span>

                    </v-col>

                    <v-col cols="auto" class="pa-0">

                      <v-select v-model="ptzSpeed" :items="[1, 2, 3, 4, 5, 6, 7, 8]" density="compact"
                        style="width: 72px;"></v-select>

                    </v-col>

                  </v-row>

                  <!-- Zoom Control -->
                  <v-row class="mt-4" align="center" justify="center">
                    <v-col cols="auto" class="pa-0">
                      <v-btn icon class="zoom-button" @mousedown="startContinuousMove(0, 0, -1)" @mouseup="ptzStop"
                        @mouseleave="ptzStop">
                        <v-icon>mdi-minus</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col cols="auto">
                      <span class="text-body-1">Zoom</span>
                    </v-col>
                    <v-col cols="auto" class="pa-0">
                      <v-btn icon class="zoom-button" @mousedown="startContinuousMove(0, 0, 1)" @mouseup="ptzStop"
                        @mouseleave="ptzStop">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                  <!-- Focus Control -->
                  <v-row class="mt-4" align="center" justify="center">
                    <v-col cols="auto" class="pa-0">
                      <v-btn icon class="zoom-button" @mousedown="startFocusContinuous(-0.5)" @mouseup="stopFocus"
                        @mouseleave="stopFocus">
                        <v-icon>mdi-minus</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col cols="auto">
                      <span class="text-body-1">Focus</span>
                    </v-col>
                    <v-col cols="auto" class="pa-0">
                      <v-btn icon class="zoom-button" @mousedown="startFocusContinuous(0.5)" @mouseup="stopFocus"
                        @mouseleave="stopFocus">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </v-col>
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
      onvifCameras,
      selectedOnvifCamera,
      username,
      password,
      cameraData,
      errorMessage,
      selectedProfileToken,
      ptzSpeed,
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
}
</style>