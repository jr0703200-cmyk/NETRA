# NETRA — Camera Integration & Deployment Guide
### How to Connect Real Wi-Fi & IP Cameras to NETRA

NETRA connects to standard network surveillance infrastructure including Wi-Fi IP cameras, wired CCTV, RTSP encoders, HTTP/MJPEG streams, and ONVIF-compliant devices.

---

## 📋 10-Step Workflow: Connecting a Wi-Fi IP Camera

```
[ Camera On Wi-Fi ] ──► [ Obtain Local IP ] ──► [ Configure RTSP ] ──► [ Add to NETRA ] ──► [ Test Connection ] ──► [ Live AI Feed ]
```

1. **Power and Network Connection**:
   - Connect the camera to your local Wi-Fi or Ethernet switch.
   - Verify that the camera is assigned an IP on the same local subnet as the NETRA Ingestion Gateway (e.g. `192.168.1.X`).

2. **Discover Camera IP**:
   - Use the camera manufacturer's discovery tool (e.g., SADP for Hikvision, ConfigTool for Dahua) or open **NETRA Camera Lab** and click **Discover ONVIF Cameras**.
   - Alternatively, check your router's DHCP client lease table.

3. **Configure Authentication Credentials**:
   - Access the camera web management portal.
   - Create or assign an authorized surveillance operator user (e.g. `admin` or `operator`) and set a strong password.

4. **Verify RTSP Stream Service**:
   - Ensure the RTSP protocol is enabled in the camera's Network Settings (default port: `554`).
   - If using H.265/HEVC, ensure sub-stream is set to H.264 if browser compatibility is required without hardware transcoding.

5. **Identify the Manufacturer's RTSP URL**:
   - RTSP URL formats vary across camera vendors. Consult the table below for standard paths.

6. **Open NETRA Camera Network**:
   - In the left sidebar, navigate to **INFRASTRUCTURE → Camera Network**.
   - Click **Add Camera Node**.

7. **Enter Connection Parameters**:
   - Camera Name: e.g. `Main Entrance South Gate`
   - Camera ID: e.g. `CAM-009`
   - IP Address: `192.168.1.120`
   - Port: `554`
   - RTSP URL: `rtsp://admin:password@192.168.1.120:554/live/ch0`
   - Latitude / Longitude: For GIS Map placement

8. **Execute "TEST CONNECTION"**:
   - Click the **TEST CONNECTION** button.
   - NETRA will initiate a real TCP socket handshake and validate protocol response.
   - The test will report one of the following states:
     - `Connected`: Protocol validated and active.
     - `Authentication failed`: Bad username or password.
     - `Stream unavailable`: Connection refused on port.
     - `Timeout`: Device unreachable or offline.
     - `Invalid URL`: Malformed IP or address.

9. **Save Camera Node**:
   - Once validated, click **SAVE CAMERA**.
   - The sensitive credentials are encrypted and stored in the secure vault; they will never be transmitted to client browsers.

10. **Enable AI Computer Vision Pipeline**:
    - The camera feed is automatically ingested by the gateway, piped to the **Live Monitor**, and indexed by the **AI Neural Engine** for ANPR and zone intrusion detection.

---

## 📡 Common Manufacturer RTSP Stream URL Reference

| Manufacturer | Primary Stream (High Res / 4K) | Sub-Stream (Low Bandwidth) |
|---|---|---|
| **Hikvision** | `rtsp://admin:password@<IP>:554/Streaming/Channels/101` | `rtsp://admin:password@<IP>:554/Streaming/Channels/102` |
| **Dahua** | `rtsp://admin:password@<IP>:554/cam/realmonitor?channel=1&subtype=0` | `rtsp://admin:password@<IP>:554/cam/realmonitor?channel=1&subtype=1` |
| **CP Plus** | `rtsp://admin:password@<IP>:554/cam/realmonitor?channel=1&subtype=0` | `rtsp://admin:password@<IP>:554/cam/realmonitor?channel=1&subtype=1` |
| **Axis** | `rtsp://root:password@<IP>:554/axis-media/media.amp` | `rtsp://root:password@<IP>:554/axis-media/media.amp?videocodec=h264` |
| **TP-Link Tapo** | `rtsp://admin:password@<IP>:554/stream1` | `rtsp://admin:password@<IP>:554/stream2` |
| **Uniview (UNV)** | `rtsp://admin:password@<IP>:554/unicast/c1/s0/live` | `rtsp://admin:password@<IP>:554/unicast/c1/s1/live` |
| **Generic ONVIF** | `rtsp://admin:password@<IP>:554/live/ch0` | `rtsp://admin:password@<IP>:554/live/ch1` |
| **Android (IP Webcam)** | `http://<IP>:8080/video` (MJPEG) | `rtsp://<IP>:8080/h264_pcm.sdp` (RTSP) |
| **iOS (IP Camera Lite)**| `rtsp://<IP>:8554/live` (RTSP) | `http://<IP>:8081/video` (MJPEG) |
| **DroidCam (Android/iOS)** | `http://<IP>:4747/video` (MJPEG) | `http://<IP>:4747/mjpegfeed` |

---

## 📱 Using a Smartphone as a Wi-Fi ANPR Camera

You can turn any Android smartphone or iPhone into an active NETRA surveillance node in under 2 minutes:

### 1. Recommended Mobile Apps
* **Android**: Download **IP Webcam** (by Pavel Khlebovich from Google Play Store). Free and supports both HTTP/MJPEG and RTSP.
* **iOS (iPhone/iPad)**: Download **IP Camera Lite** (by ShenYao China from App Store) or **DroidCam**.

### 2. Mobile Setup Workflow
1. **Connect to Same Wi-Fi**: Ensure your smartphone and the computer running NETRA are on the **exact same Wi-Fi router** (e.g. `192.168.1.X`).
2. **Start Server in App**:
   * Open the app (e.g. **IP Webcam**).
   * Optionally set video resolution to `1280x720` or `1920x1080` for sharper ANPR license plate recognition.
   * Scroll to the bottom and tap **"Start server"**.
3. **Note the Displayed URL**:
   * The app will display an on-screen URL, e.g., `http://192.168.1.45:8080`.
4. **Test in NETRA Camera Lab**:
   * Open NETRA at `http://localhost:3000` and go to **Camera Lab**.
   * Paste `http://<your-phone-ip>:8080/video` into the stream URL field.
   * Click **TEST CONNECTION** and **PREVIEW STREAM**.
5. **Add to NETRA Camera Network**:
   * Go to **Camera Network** → **Add Camera Node**.
   * Set IP: `<your-phone-ip>`, Port: `8080`, Stream URL: `http://<your-phone-ip>:8080/video`.
   * Click **SAVE CAMERA**.
6. **Point at Number Plates**:
   * Position the phone facing incoming traffic, parking gate, or a test number plate.
   * The live stream appears on the **Live Monitor** and feeds into the ANPR & Watchlist detection engine.

---

## ⚠️ Important Real-World Deployment Limitations

1. **Browser Ingestion**:
   - Web browsers cannot natively consume raw RTSP protocols inside `<video>` elements.
   - NETRA solves this using a dedicated **Camera Ingestion Gateway** that proxies and converts feeds to browser-compatible multipart MJPEG and HLS formats.

2. **Network Address Translation (NAT) & Firewalls**:
   - If the camera is located behind a different router, configure port forwarding for RTSP port `554` or place the NETRA Gateway on a shared VPN / Tailscale mesh.

3. **Codec Selection**:
   - Prefer **H.264** encoding in camera settings for lowest latency transcoding.

