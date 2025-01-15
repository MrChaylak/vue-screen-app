<template>
  <v-footer app>
    <v-container fluid>
      <v-row align="center" justify="center">

        <!-- Connect Button -->
        <v-btn 
          icon 
          @click="$emit('connect')" 
          class="mx-3"
        >
          <v-icon>mdi-wifi</v-icon>
        </v-btn>

        <!-- Camera Device Selection -->
        <v-select
          label="Select Camera"
          v-model="selectedCamera"
          :items="cameraOptions"
          item-text="label"
          item-value="deviceId"
          class="mx-3"
          dense
          outlined
          style="max-width: 180px;"
        />

        <!-- Camera Toggle Button -->
        <v-btn icon @click="toggleCamera" class="mx-3">
          <v-icon>{{ isCameraOn ? 'mdi-camera' : 'mdi-camera-off' }}</v-icon>
        </v-btn>

        <!-- Share Screen Button -->
        <v-btn 
          v-if="!isScreenSharing" 
          icon 
          @click="$emit('share-screen')" 
          class="mx-3"
        >
          <v-icon>mdi-monitor-share</v-icon>
        </v-btn>

        <!-- Stop Screen Share Button -->
        <v-btn 
          v-if="isScreenSharing" 
          icon 
          @click="$emit('stop-screen-share')" 
          class="mx-3"
        >
          <v-icon>mdi-monitor-off</v-icon>
        </v-btn>

        <!-- Theme Toggle Button -->
        <v-btn icon @click="toggleTheme" class="mx-3">
          <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
        </v-btn>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script lang="ts">
import { useTheme } from 'vuetify';
import { ref, computed } from 'vue';

export default {
  name: 'BottomBar',
  props: {
    participantCount: {
      type: Number,
      required: true
    },
    cameraOptions: {
      type: Array,
      required: true
    },
    selectedCameraId: {
      type: String,
      required: false
    },
    isScreenSharing: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const theme = useTheme();

    // Computed to know if the current theme is dark
    const isDarkTheme = computed(() => theme.global.current.value.dark);

    const toggleTheme = () => {
      // Toggle between light and dark themes
      theme.global.name.value = isDarkTheme.value ? 'light' : 'dark';
    };

    return { theme, toggleTheme, isDarkTheme };
  },
  data() {
    return {
      isCameraOn: false,
      selectedCamera: this.selectedCameraId || null
    };
  },
  methods: {
    toggleCamera() {
      this.isCameraOn = !this.isCameraOn;
      this.$emit('toggle-camera', this.isCameraOn, this.selectedCamera);
    },
    shareScreen() {
      console.log('Screen sharing started');
    }
  },
  watch: {
    selectedCamera(newVal) {
      this.$emit('update-camera', newVal);
    }
  }
};
</script>

<style scoped>
v-btn {
  margin: 0 15px;
}
</style>
