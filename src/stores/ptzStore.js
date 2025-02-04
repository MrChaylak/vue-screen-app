// src/stores/ptzStore.js
import { createStore } from 'vuex';

export default createStore({
  state: {
    selectedOnvifCamera: '',  // The camera's IP address
    username: '',
    password: '',
    selectedProfileToken: '',
    // cameraData: null,         // Any additional camera data
  },
  mutations: {
    setSelectedOnvifCamera(state, camera) {
      state.selectedOnvifCamera = camera;
    },
    setUsername(state, username) {
      state.username = username;
    },
    setPassword(state, password) {
      state.password = password;
    },
    setSelectedProfileToken(state, token) {
      state.selectedProfileToken = token;
    },
    // setCameraData(state, data) {
    //   state.cameraData = data;
    // },
  },
  actions: {
    updateCameraData({ commit }, payload) {
      commit('setSelectedOnvifCamera', payload.selectedOnvifCamera);
      commit('setUsername', payload.username);
      commit('setPassword', payload.password);
      commit('setSelectedProfileToken', payload.selectedProfileToken);
      // commit('setCameraData', payload.cameraData);
    },
  },
  getters: {
    selectedOnvifCamera: state => state.selectedOnvifCamera,
    username: state => state.username,
    password: state => state.password,
    selectedProfileToken: state => state.selectedProfileToken,
    // cameraData: state => state.cameraData,
  },
});
