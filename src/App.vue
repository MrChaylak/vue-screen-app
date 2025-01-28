<template>
  <v-app>
    <v-main>
      <RouterView />

      <v-bottom-navigation
        class="bottom-navigation"
        grow
        color="primary"
      >
        <v-btn value="home" to="/" exact>
          <v-icon>mdi-home</v-icon>
          <span>Home</span>
        </v-btn>

        <v-btn value="screen-share" to="/screen-share">
          <v-icon>mdi-monitor-screenshot</v-icon>
          <span>Remote Screen Share</span>
        </v-btn>

        <v-btn value="onvif-camera" to="/onvif-camera">
          <v-icon>mdi-cctv</v-icon>
          <span>ONVIF Camera</span>
        </v-btn>
        <v-btn icon @click="toggleTheme" class="mx-3">
          <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { useThemeMixin } from './mixins/themeMixin';

export default {
  name: 'App',
  components: { RouterLink, RouterView },
  mixins: [useThemeMixin],

  setup() {
      // Use the mixin
      const { theme, toggleTheme, isDarkTheme } = useThemeMixin();
    
      return { theme, toggleTheme, isDarkTheme };
  }
};
</script>

<style scoped>
/* Custom styles for the bottom navigation */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 1000;

  /* Initially hidden */
  opacity: 0;
  transform: translateY(100%);
  transition: opacity 0.3s, transform 0.3s;
}

/* Show the navbar on hover */
.bottom-navigation:hover {
  opacity: 1;
  transform: translateY(0);
}

/* Add an always-visible handle (optional, for better UX) */
.bottom-navigation::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 5px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  pointer-events: none;
}

span {
  text-align: center;
}
</style>
