# Vue Remote Screen and Onvif Camera Control App

With this **Vue** app you can remotely control shared screens, display available camera and control Onvif Cameras. The screen-share route uses **WebRTC** and **Electron** to get and display the remote devices available screens and cameras. The onvif-camera route uses **Flask** to discover Onvif cameras on network and display its details. You can also control the cameras PTZ (Pan-Tilt-Zoom) actions if available.

## Table of Contents

- [Used Technologies](#used-technologies)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [License](#-License)

---

## Used Technologies

- 🟣 [Vuetify](https://vuetifyjs.com/) for styling.
- 🟢 [Vue](https://vuejs.org/) for frontend framework.
- 🔵 [Electron](https://www.electronjs.org/) for getting devices screen and camera.
- 🟡 [WebRTC](https://webrtc.org/) for real-time stream of screen and camera.
- 🔴 [Flask](https://flask.palletsprojects.com/) for backend API to control onvif cameras

## 📌 Prerequisites

Before setting up the project, ensure you have the following tools installed on your machine:

- [Node.js (v16 or higher)](https://nodejs.org/)
- npm (comes with Node.js) or Yarn
- [Git](https://git-scm.com/)


To verify the installation, run the following commands:

```bash
node -v
npm -v
git --version
```

Ensure you see version numbers for each.

**My Versions**:

- Node.js v22.12.0
- npm 10.9.2
- Git 2.46.0.windows.1

## 💿 Installation

To set up the project, follow these steps:

- **Clone the Repository**: 

```bash
git clone https://github.com/MrChaylak/vue-screen-app.git
cd vue-screen-app
```

- **Install Dependencies**: 

```bash
npm install
```

This command installs all required dependencies listed in package.json.

## 💡 Running the Application

To run the application in development mode, use the following command:

```bash
npm run dev
```

This will run the Vue app and it will be served on [http://localhost:3000](http://localhost:3000/).

Note: This command starts only the vue app, for remote screen functionality you will have to clone and run **Server** and **Electron** repositories and for onvif cameras you will need the **Flask** repository which you can find the links to here:
- [Server](https://github.com/MrChaylak/server-screen-app.git) - The signaling server for WebRTC communication between Vue and Electron.
- [Electron](https://github.com/MrChaylak/electron-screen-app.git) - Gets the devices available screens and camera feed for Vue to display them.
- [Flask](https://github.com/MrChaylak/onvif-flask.git) - API to control Onvif cameras on network.

> Add NODE_OPTIONS='--no-warnings' to suppress the JSON import warnings that happen as part of the Vuetify import mapping. If you are on Node [v21.3.0](https://nodejs.org/en/blog/release/v21.3.0) or higher, you can change this to NODE_OPTIONS='--disable-warning=5401'. If you don't mind the warning, you can remove this from your package.json dev script.

## 📑 License
[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016-present Vuetify, LLC
