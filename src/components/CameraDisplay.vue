<template>
    <v-card class="pa-2">
      <v-row justify="center">
        <video 
          ref="videoElement" 
          autoplay 
          playsinline 
          style="width: 100%; height: auto; background-color: #000;">
        </video>
      </v-row>
    </v-card>
  </template>
  
  <script>
  export default {
    name: "CameraDisplay",
    props: {
      stream: {
        type: MediaStream,
        required: false
      }
    },
    watch: {
      stream(newStream) {
        if (newStream) {
          this.attachStream(newStream);
        }
      }
    },
    methods: {
      attachStream(stream) {
        const videoElement = this.$refs.videoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }
    },
    mounted() {
      if (this.stream) {
        this.attachStream(this.stream);
      }
    },
  };
  </script>
  
  <style scoped>
  video {
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  </style>