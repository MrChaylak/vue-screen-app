export class FlaskClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getOnvifCameraList(): Promise<{ devices: string[] }> {
    const response = await fetch(this.baseUrl + '/api/onvif-devices');
    if (!response.ok) {
      throw new Error('Failed to fetch ONVIF devices');
    }

    const data = await response.json();

    // Sort the IP addresses in ascending order
    data.devices.sort((a: string, b: string) => {
      const ipA = a.split('.').map(Number);
      const ipB = b.split('.').map(Number);

      // Compare each octet numerically
      for (let i = 0; i < 4; i++) {
        if (ipA[i] < ipB[i]) return -1;
        if (ipA[i] > ipB[i]) return 1;
      }

      return 0; // If the IPs are the same
    });

    return data;
  }

  async getOnvifCameraData(ip: string, username: string, password: string): Promise<any> {
    try {
      // Send a request to your Flask backend to fetch ONVIF camera data
      const response = await fetch(`${this.baseUrl}/api/onvif-camera-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          username,
          password,
        }),
      });

      if (!response.ok) {
        const data: { errors?: Record<string, string[]>; error?: string } = await response.json();
        // console.log(data);

        let errorMessage = "";

        if (data.errors && typeof data.errors === "object") {
          // Flatten all error messages into a single string without field names
          errorMessage = Object.values(data.errors)
            .flat() // Flatten array of arrays (if needed)
            .join(", "); // Join all messages with ", "
          errorMessage = errorMessage.endsWith('.') ? errorMessage : errorMessage + '.';
        } else if (typeof data.error === "string") {
          errorMessage = data.error; // Handle single error message
        } else {
          errorMessage = "An unknown error occurred.";
        }

        throw new Error(errorMessage); // Only throws the actual message
      }

      const data = await response.json();
      // console.log(data);
      return data;
    } catch (error) {
      console.error('Error fetching ONVIF camera data:', error);
      throw error;
    }
  }

  async setOnvifCameraProfile(ip: string, username: string, password: string, profileToken: string): Promise<{ stream_uri: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/set-onvif-camera-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          username,
          password,
          profileToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set ONVIF camera profile');
      }

      const data = await response.json();
      return data; // Ensure the response contains `stream_uri`
    } catch (error) {
      console.error('Error setting ONVIF camera profile:', error);
      throw error;
    }
  }

  async ptzMove(ip: string, username: string, password: string, profileToken: string, panSpeed: number, tiltSpeed: number, zoomSpeed: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ptz-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          username,
          password,
          profile_token: profileToken,  // match the backend field name
          pan_speed: panSpeed,          // match the backend field name
          tilt_speed: tiltSpeed,        // match the backend field name
          zoom_speed: zoomSpeed,        // match the backend field name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop PTZ movement');
      }

      const data = await response.json();
      return data; // Ensure the response contains a success message
    } catch (error) {
      console.error('Error performing PTZ movement:', error);
      throw error;
    }
  }

  async ptzStop(ip: string, username: string, password: string, profileToken: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ptz-stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          username,
          password,
          profile_token: profileToken,  // match the backend field name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop PTZ movement');
      }

      const data = await response.json();
      return data; // Ensure the response contains a success message
    } catch (error) {
      console.error('Error stopping PTZ movement:', error);
      throw error;
    }
  }

  async moveFocusContinuous(ip: string, username: string, password: string, profileToken: string, speed: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/move-focus-continuous`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          username,
          password,
          profileToken,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start continuous focus adjustment');
      }

      const data = await response.json();
      return data; // Ensure the response contains a success message
    } catch (error) {
      console.error('Error starting continuous focus adjustment:', error);
      throw error;
    }
  }

  async stopFocus(ip: string, username: string, password: string, profileToken: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stop-focus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          username,
          password,
          profileToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop focus adjustment');
      }

      const data = await response.json();
      return data; // Ensure the response contains a success message
    } catch (error) {
      console.error('Error stopping focus adjustment:', error);
      throw error;
    }
  }
}
