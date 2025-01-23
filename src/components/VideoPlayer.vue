<!-- VideoPlayer.vue -->
<template>
    <div>
      <video ref="videoPlayer" class="video-js vjs-default-skin" controls></video>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
  import videojs from 'video.js';
  import 'video.js/dist/video-js.css';
  
  export default defineComponent({
    name: 'VideoPlayer',
    props: {
      src: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const videoPlayer = ref<HTMLVideoElement | null>(null);
      let player: any = null;
  
      onMounted(() => {
        if (videoPlayer.value) {
          player = videojs(videoPlayer.value, {
            autoplay: true,
            controls: true,
            sources: [
              {
                src: props.src,
                type: 'application/x-mpegURL', // Adjust based on the stream type
              },
            ],
          });
        }
      });
  
      // Update the player when the `src` prop changes
      watch(
        () => props.src,
        (newSrc) => {
          if (player) {
            player.src({ src: newSrc, type: 'application/x-mpegURL' });
          }
        }
      );
  
      // Clean up the player when the component is destroyed
      onUnmounted(() => {
        if (player) {
          player.dispose();
        }
      });
  
      return {
        videoPlayer,
      };
    },
  });
  </script>
  
  <style scoped>
  .video-js {
    width: 100%;
    max-width: 800px;
    height: auto;
  }
  </style>