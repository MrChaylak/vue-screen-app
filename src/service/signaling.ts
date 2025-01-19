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

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
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
            // this.dataChannel.close();
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
            // this.dataChannel.close();
            this.peerConnection.close();
            this.createPeerConnection(); // Recreate the peer connection
        }

    }
}