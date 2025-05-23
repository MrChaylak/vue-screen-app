export class WebRTCClient {
    signalingServer: WebSocket;
    peerConnection!: RTCPeerConnection;
    remoteStream: MediaStream | null = null;
    onRemoteStream: ((stream: MediaStream) => void) | null = null;
    onCameraList: ((cameras: Array<{ deviceId: string; label: string }>) => void) | null = null;
    onScreenList: ((screens: Array<{ id: string; name: string; thumbnail: string }>) => void) | null = null;
    dataChannel!: RTCDataChannel;
    id: string;

    constructor(signalingServerUrl: string, id: string) {
        this.id = id;
        this.signalingServer = new WebSocket(signalingServerUrl);

        this.signalingServer.onmessage = this.handleSignalingMessage.bind(this);
        this.signalingServer.onopen = () => {
            console.log('Connected to signaling server with id ' + this.id);
        };

        this.createPeerConnection();
    }

    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        this.peerConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;
            dataChannel.onopen = () => {
                console.log(`Data channel opened for ${this.id}`);
            };
            dataChannel.onmessage = (event) => {
                console.log(`Received data channel message on ${this.id}:`, event.data);
                this.handleDataChannelMessage(event.data);
            };
            this.dataChannel = dataChannel;
        }

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`ICE candidate generated for ${this.id}:`, event.candidate);
                this.signalingServer.send(JSON.stringify({ type: 'ice-candidate', id: this.id, candidate: event.candidate }));
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log(`Received remote track for ${this.id}:`, event.track);
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                if (this.onRemoteStream) {
                    console.log(`Initializing remote stream for ${this.id}`);
                    this.onRemoteStream(this.remoteStream);
                }
            }
            this.remoteStream.addTrack(event.track);
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log(`Peer connection state changed for ${this.id}:`, this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'disconnected') {
                console.log(`Peer connection disconnected for ${this.id}`);
                this.cleanup();
            }
        };
    }

    async handleSignalingMessage(messageEvent: MessageEvent) {
        const data = JSON.parse(messageEvent.data);
        if (data.id !== undefined && data.id !== this.id) return;
        if (data.type === 'offer') {
            console.log('Received offer with data:', data);
            await this.handleOffer(data.sdp);
        } else if (data.type === 'ice-candidate') {
            if (data.candidate) {
                console.log('Adding ICE candidate:', data.candidate);
                const candidate = new RTCIceCandidate(data.candidate);
                await this.peerConnection.addIceCandidate(candidate);
            }
        } else if (data.type === 'camera-list') {
            console.log('Received camera list:', data.cameras);
            if (this.onCameraList) {
                this.onCameraList(data.cameras);
            }
        } else if (data.type === 'screen-list') {
            console.log('Received screen list:', data.screens);
            if (this.onScreenList) {
                this.onScreenList(data.screens);
            }
        }
    }

    async handleOffer(sdp: string) {
        const offer: RTCSessionDescriptionInit = { type: 'offer', sdp }; // Correct type
        await this.peerConnection.setRemoteDescription(offer); // Pass directly without RTCSessionDescription

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.signalingServer.send(JSON.stringify({ type: 'answer', id: this.id, sdp: this.peerConnection.localDescription?.sdp }));
    }

// In your WebRTCClient class

    requestCameraList() {
        this.signalingServer.send(JSON.stringify({ type: 'get-cameras', id: this.id }));
    }

    requestScreenList() {
        this.signalingServer.send(JSON.stringify({ type: 'get-screens', id: this.id }));
    }

    startCamera(deviceId: string) {
        this.signalingServer.send(JSON.stringify({ type: 'start-camera', id: this.id, deviceId }));
    }

    stopCamera() {
        // set remoteStream to null to stop the camera
        this.remoteStream = null;
        this.signalingServer.send(JSON.stringify({type: 'stop-camera', id: this.id}));

        // Reset peer connection state
        if (this.peerConnection) {
            this.peerConnection.getSenders().forEach((sender) => {
                if (sender.track && sender.track.kind === 'video') {
                    this.peerConnection.removeTrack(sender);
                }
            });
            if (this.dataChannel) {
                this.dataChannel.close(); // Close the data channel if it exists
            }
            this.peerConnection.close();
            this.createPeerConnection(); // Recreate the peer connection

        }
    }

    startScreenShare(screenId: string) {
        this.signalingServer.send(JSON.stringify({ type: 'start-screen-share', id: this.id, screenId }));
    }

    stopScreenShare() {
        // set remoteStream to null to stop the screen share
        this.remoteStream = null;
        this.signalingServer.send(JSON.stringify({ type: 'stop-screen-share', id: this.id }));

        // Reset peer connection state
        if (this.peerConnection) {
            this.peerConnection.getSenders().forEach((sender) => {
                if (sender.track && sender.track.kind === 'video') {
                    this.peerConnection.removeTrack(sender);
                }
            });
            if (this.dataChannel) {
                this.dataChannel.close(); // Close the data channel if it exists
            }
            this.peerConnection.close();
            this.createPeerConnection(); // Recreate the peer connection
        }

    }

    sendMouseMove(x: number, y: number) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const message = JSON.stringify({ type: 'mouse-move', x, y });
            this.dataChannel.send(message);
        } else {
            console.error('Data channel is not open');
        }
    }

    sendMouseClick(button = 'left', doubleClick = false) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const message = JSON.stringify({ type: 'mouse-click', button, doubleClick });
            this.dataChannel.send(message);
        } else {
            console.error('Data channel is not open');
        }
    }

    sendKeyPress(key: string, modifiers: string[] = []) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const message = JSON.stringify({ type: 'key-press', key, modifiers });
            this.dataChannel.send(message);
        } else {
            console.error('Data channel is not open');
        }
    }

    sendMouseScroll(x: number, y: number) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const message = JSON.stringify({ type: 'mouse-scroll', x, y });
            this.dataChannel.send(message);
        } else {
            console.error('Data channel is not open');
        }
    }

    handleDataChannelMessage(data: string) {
        console.log(`Data channel message received: ${data}`);
    }

    cleanup() {
        // Stop any active camera or screen sharing
        this.stopCamera();
        this.stopScreenShare();

        // Close the peer connection
        if (this.peerConnection) {
            this.peerConnection.getSenders().forEach((sender) => {
                if (sender.track) {
                    sender.track.stop(); // Stop the track
                }
            });
            this.peerConnection.close(); // Close the connection
        }

        // Reset the remote stream
        this.remoteStream = null;

        // Close the signaling server connection
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.signalingServer.close();
        }

        console.log('WebRTCClient cleanup completed.');
    }
}