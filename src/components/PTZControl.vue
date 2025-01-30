<template>
  <!-- PTZ Controls -->
  <!-- v-if="cameraData.ptz_available" -->
  <v-card class="mt-4">
    <v-card-title>PTZ Controls</v-card-title>
    <v-card-text>
      <v-container class="ptz-controls pr-0 pl-0">
        <!-- Grid Container -->
        <div class="ptz-grid">
          <!-- PTZ Buttons -->
          <template v-for="(button, index) in ptzButtons" :key="`ptz-button-${index}`">
            <v-btn icon class="ptz-button" @mousedown="startContinuousMove(...button.params)"
              @mouseup="stopContinuousMove">
              <v-icon>{{ button.icon }}</v-icon>
            </v-btn>
          </template>

          <!-- Center Button -->
          <v-btn icon class="ptz-button center-button" @click="stopContinuousMove">
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
                @mouseup="stopContinuousMove">
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
                @mouseup="stopFocus">
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
</template>

<script lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import { FlaskClient } from '@/service/backendService';

export default {
  name: 'PTZControl',

  props: {
    selectedOnvifCamera: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    selectedProfileToken: {
      type: String,
      required: true
    },
  },

  setup(props) {
    const flaskClient = ref<FlaskClient | null>(null);
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

    // Start continuous movement
    const startContinuousMove = async (panSpeed: number, tiltSpeed: number, zoomSpeed: number) => {
      const adjustedPanSpeed = panSpeed * (ptzSpeed.value / 8);
      const adjustedTiltSpeed = tiltSpeed * (ptzSpeed.value / 8);
      const adjustedZoomSpeed = zoomSpeed;
      try {
        if (flaskClient.value && props.selectedProfileToken) {
          await flaskClient.value.ptzMove(
            props.selectedOnvifCamera,
            props.username,
            props.password,
            props.selectedProfileToken,
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
        try {
          if (flaskClient.value && props.selectedProfileToken) {
            await flaskClient.value.ptzStop(
              props.selectedOnvifCamera,
              props.username,
              props.password,
              props.selectedProfileToken,
            );
          }
        } catch (error) {
          console.error('Failed to stop PTZ movement:', error);
        }
    };


    // Start continuous focus adjustment
    const startFocusContinuous = async (speed: number) => {
      try {
        if (flaskClient.value && props.selectedProfileToken) {
          await flaskClient.value.moveFocusContinuous(
            props.selectedOnvifCamera,
            props.username,
            props.password,
            props.selectedProfileToken,
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
        if (flaskClient.value && props.selectedProfileToken) {
          await flaskClient.value.stopFocus(
            props.selectedOnvifCamera,
            props.username,
            props.password,
            props.selectedProfileToken,
          );
        }
      } catch (error) {
        console.error('Error stopping focus:', error);
      }
    };
    
    onMounted(() => {
      flaskClient.value = new FlaskClient('http://127.0.0.1:5000');
    });

    return {
      ptzSpeed,
      ptzButtons,
      zoomButtons,
      focusButtons,
      startContinuousMove,
      stopContinuousMove,
      startFocusContinuous,
      stopFocus,
    };
  },
};
</script>