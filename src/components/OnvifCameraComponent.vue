<template>
    <v-card class="pa-4">
      <v-card-text class="pa-0">
        <v-container>
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
        onvifCameras,
        selectedOnvifCamera,
        isOnvifCameraSharing,
        sharedOnvifCamera,
      };
    },
  });
  </script>
  
  <style>
  
  </style>