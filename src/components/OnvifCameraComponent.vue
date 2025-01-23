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
          <v-col>
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
                </v-list>

                <!-- Media Profiles -->
                <v-expansion-panels class="mt-4">
                  <v-expansion-panel v-for="(profile, index) in cameraData.profiles" :key="index">
                    <v-expansion-panel-title>
                      <span class="mr-2">Profile {{ index + 1 }}</span>
                      <v-btn
                        v-if="selectedProfileToken === profile.token"
                        icon
                        color="primary"
                        size="x-small"
                        @click.stop="selectProfile(profile.token)"
                      >
                        <v-icon>mdi-check</v-icon>
                      </v-btn>
                      <v-btn
                        v-else
                        icon
                        size="x-small"
                        @click.stop="selectProfile(profile.token)"
                      >
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
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, onUnmounted } from 'vue';
import { FlaskClient } from '@/service/flask';
import { nextTick } from 'vue';

export default defineComponent({
  name: 'OnvifCameraComponent',
  setup() {
    const flaskClient = ref<FlaskClient | null>(null);
    const onvifCameras = ref<Array<{ ip: string; }>>([]);
    const selectedOnvifCamera = ref<string>('');
    const sharedOnvifCamera = ref<string>('');
    const isOnvifCameraSharing = ref(false);
    let onvifCameraListInterval: number | null = null;
    const username = ref<string>('');
    const password = ref<string>('');
    const cameraData = ref<any>(null);
    const errorMessage = ref<string>('');
    const selectedProfileToken = ref<string>('');
    const streamUri = ref<string>('');

    const getOnvifCameraList = async () => {
      try {
        if (flaskClient.value) {
          // Fetch the list of devices
          const response = await flaskClient.value.getOnvifCameraList();

          // Update the `onvifCameras` state
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
          errorMessage.value = ''; // Clear any previous error message

          // Pre-select the first profile by default
          if (data.profiles.length > 0) {
            selectedProfileToken.value = data.profiles[0].token;
          }
        } else {
          console.error('FlaskClient is not initialized.');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          errorMessage.value = 'Incorrect username or password';
        } else {
          errorMessage.value = 'Failed to fetch ONVIF camera data';
        }
        console.error('Error:', error);
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
      onvifCameras,
      selectedOnvifCamera,
      isOnvifCameraSharing,
      sharedOnvifCamera,
      username,
      password,
      cameraData,
      errorMessage,
      selectedProfileToken,
      onvifCameraListInterval,
    };
  },
});
</script>

<style></style>