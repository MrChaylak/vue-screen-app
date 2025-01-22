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
      
  }
  