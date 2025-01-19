<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <v-row no-gutters class="fill-height">
          <!-- Left Side: Remote Desktop Component -->
          <v-col cols="12" md="9" class="fill-height">
            <RemoteDesktopComponent class="fill-height" />
          </v-col>

          <!-- Right Side: Camera Component -->
          <v-col cols="12" md="3" class="d-flex flex-column">
            <CameraComponent class="flex-grow-1" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import CameraComponent from './components/CameraComponent.vue';
import RemoteDesktopComponent from './components/RemoteDesktopComponent.vue';

export default {
  name: 'App',
  components: {
    CameraComponent,
    RemoteDesktopComponent,
  },
  data() {
    return {
      cameras: [],
      selectedCameraId: null,
      isCameraRunning: false,
      showScreenDialog: false,
      screenStream: null,
    };
  },
};
</script>

<style>
.fill-height {
  height: 100%;
}

.camera-component {
  width: 100%;
  height: auto;
}
</style>
