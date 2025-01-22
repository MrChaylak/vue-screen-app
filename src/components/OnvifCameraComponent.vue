<template>
    <v-card class="pa-4">
      <v-card-text class="pa-0">
        <v-container>
          <!-- Input Fields and Button -->
          <v-row align="center">
            <v-col cols="auto">
              <v-select
                v-model="selectedOnvifCamera"
                :items="onvifCameras"
                item-title="ip"
                item-value="ip"
                label="Select a Camera"
                style="width: 200px;"
              ></v-select>
            </v-col>
            <v-col cols="auto">
              <v-text-field
                v-model="username"
                label="Username"
                style="width: 200px;"
              ></v-text-field>
            </v-col>
            <v-col cols="auto">
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                style="width: 200px;"
              ></v-text-field>
            </v-col>
            <v-col cols="auto">
              <v-btn @click="getOnvifCameraData" color="primary">Get Data</v-btn>
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
                  </v-list>
  
                  <!-- Media Profiles -->
                  <v-expansion-panels class="mt-4">
                    <v-expansion-panel v-for="(profile, index) in cameraData.profiles" :key="index">
                      <v-expansion-panel-title>Profile {{ index + 1 }}</v-expansion-panel-title>
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
        const onvifCameras = ref<Array<{ ip: string;}>>([]);
        const selectedOnvifCamera = ref<string>('');
        const sharedOnvifCamera = ref<string>('');
        const isOnvifCameraSharing = ref(false);
        let onvifCameraListInterval: number | null = null;
        const username = ref<string>('');
        const password = ref<string>('');
        const cameraData = ref<any>(null);

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
          console.log('ONVIF Camera Data:', data);
        } else {
          console.error('FlaskClient is not initialized.');
        }
      } catch (error) {
        console.error('Failed to fetch ONVIF camera data:', error);
      }
    };

      
      
      
      onMounted(() => {
        flaskClient.value = new FlaskClient('http://127.0.0.1:5000');

        onvifCameraListInterval = setInterval(getOnvifCameraList, 5000);
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
        onvifCameras,
        selectedOnvifCamera,
        isOnvifCameraSharing,
        sharedOnvifCamera,
        username,
        password,
        cameraData,
      };
    },
  });
  </script>
  
  <style>
  
  </style>