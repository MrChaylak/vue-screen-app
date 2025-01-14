<template>
  <div class="screen-container border-md">

    <!-- Screen Share Display -->
    <div class="screen-share-display">
      <video 
        ref="screenVideo" 
        autoplay 
        playsinline 
        style="width: 100%; height: 100%; background-color: #000;">
      </video>
    </div>

    <!-- Camera Feed Display (Floating on Top of the Screen Share) -->
    <div v-if="isCameraRunning" class="camera-feed">
      <CameraDisplay :stream="currentStream" />
    </div>

    <!-- Screen Selection Dialog -->
    <v-dialog 
      :value="showScreenDialog" 
      @input="$emit('update:showScreenDialog', $event)"
      max-width="600px"
    >
      <v-card>
        <v-card-title>Select a screen to share</v-card-title>
        <v-card-text>
          <v-row>
            <v-col 
              v-for="source in screenSources" 
              :key="source.id" 
              cols="6" 
              class="screen-option"
            >
              <v-img 
                :src="source.thumbnail" 
                aspect-ratio="16/9" 
                @click="$emit('startScreenShare', source)"
                class="screen-thumbnail"
              />
              <p class="text-center">{{ source.name }}</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="$emit('update:showScreenDialog', false)">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import CameraDisplay from "./CameraDisplay.vue";

export default {
  name: "ScreenContent",
  components: { CameraDisplay },
  props: {
    isCameraRunning: {
      type: Boolean,
      required: true,
    },
    currentStream: {
      type: Object,
      default: null,
    },
    showScreenDialog: {
      type: Boolean,
      required: true,
    },
    screenSources: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
/* Screen container holds screen share and camera feed */
.screen-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 102px);
  border-radius: 8px;
  overflow: hidden;
}

/* Fullscreen for the screen share */
.screen-share-display {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
}

/* Camera feed as a floating window */
.camera-feed {
  position: absolute;
  top: 20px; /* Position relative to the screen video */
  right: 20px;
  width: 200px;
  height: 120px;
  background-color: #000;
  border: 2px solid #adadad;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Ensures camera feed is on top */
  overflow: hidden;
}

.screen-option {
  cursor: pointer;
}

.screen-thumbnail {
  border-radius: 8px;
  border: 2px solid #ccc;
}

.screen-thumbnail:hover {
  border-color: #3f51b5;
}
</style>
