/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

import store from './stores/ptzStore';

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)

// Use the store
app.use(store);

app.mount('#app')
