<template>
  <v-card class="pa-4">
    <v-card-text class="pa-0">
      <v-container>
        <!-- Input Fields and Button -->
        <v-form v-model="formValid" @submit.prevent="getOnvifCameraData">
          <v-row align="center">
            <!-- Refresh Button -->
            <v-col cols="auto">
              <v-btn @click="getOnvifCameraList" color="primary" style="width: 2vw; min-width: 40px;">
                <v-icon left>mdi-refresh</v-icon>
              </v-btn>
            </v-col>

            <!-- Camera Select -->
            <v-col cols="auto">
              <v-select v-model="selectedOnvifCamera" :items="onvifCameras" item-title="ip" item-value="ip"
                label="Select a Camera" style="width: 15vw; min-width: 130px;"
                :rules="[v => !!v || 'Camera is required']"></v-select>
            </v-col>

            <!-- Username Input -->
            <v-col cols="auto">
              <v-text-field v-model="username" label="Username" style="width: 15vw; min-width: 130px;"
                :rules="[v => !!v || 'Username is required']"></v-text-field>
            </v-col>

            <!-- Password Input -->
            <v-col cols="auto">
              <v-text-field v-model="password" label="Password" type="password" style="width: 15vw; min-width: 130px;"
                :rules="[
                  v => !!v || 'Password is required',
                  v => (v && v.length >= 8) || 'Password must be at least 8 characters',
                ]"></v-text-field>
            </v-col>

            <!-- Get Data Button -->
            <v-col cols="auto">
              <v-btn type="submit" color="primary" style="width: 10vw; min-width: 90px;" :disabled="!formValid">
                Get Data
              </v-btn>
            </v-col>
          </v-row>
        </v-form>

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
                  <template v-for="(value, key) in cameraData.device_info" :key="`device_info-${key}`">
                    <v-list-item v-if="value">
                      <v-list-item-title>{{ formatKey(key) }}</v-list-item-title>
                      <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
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
            <PTZControl v-if="cameraData.ptz_available" :selectedProfileToken="selectedProfileToken"
              :selectedOnvifCamera="selectedOnvifCamera" :username="username" :password="password" />

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
import PTZControl from './PTZControl.vue';

export default {
  name: 'OnvifCameraComponent',
  components: { PTZControl },

  setup() {
    const flaskClient = ref<FlaskClient | null>(null);
    const onvifCameras = ref<Array<{ ip: string; }>>([]);
    const selectedOnvifCamera = ref<string>('');
    const formValid = ref(false);
    const username = ref<string>('');
    const password = ref<string>('');
    const cameraData = ref<any>(null);
    const errorMessage = ref<string>('');
    const selectedProfileToken = ref<string>('');
    let onvifCameraListInterval: number | null = null;
    const streamUri = ref<string>('');


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
        if (!formValid.value) {
          errorMessage.value = 'Please fix the errors before submitting.';
          return;
        }
        else if (flaskClient.value) {
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
          // // streamUri.value = response.stream_uri;
          // You can now use the stream URI to display the video stream
          // For example, pass it to a video player component

        } else {
          console.error('FlaskClient is not initialized.');
        }
      } catch (error) {
        console.error('Failed to set ONVIF camera profile:', error);
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

      // onvifCameraListInterval = setInterval(getOnvifCameraList, 60000);
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
      formatKey,
      onvifCameras,
      selectedOnvifCamera,
      formValid,
      username,
      password,
      cameraData,
      errorMessage,
      selectedProfileToken,
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