# CCTV Streaming Integration Guide

## Current Setup vs Real CCTV

### Current Setup (Test Stream)
- **Format:** HLS (HTTP Live Streaming)
- **URL:** `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
- **Extension:** `.m3u8`
- **Browser Support:** ✅ Works directly in browsers
- **Player:** Standard HTML5 `<video>` tag or HLS.js

### Real CCTV Systems
- **Format:** Usually RTSP (Real-Time Streaming Protocol)
- **URL Example:** `rtsp://192.168.1.100:554/stream1`
- **Extension:** No extension (RTSP protocol)
- **Browser Support:** ❌ Does NOT work directly in browsers
- **Player:** Requires conversion to HLS/WebRTC

---

## Solution: Convert RTSP to HLS

Real CCTV feeds need to be converted from RTSP to HLS for web browsers.

### Option 1: Streaming Server (Recommended)

Use a streaming server that converts RTSP → HLS:

**Popular Solutions:**
1. **MediaMTX** (formerly rtsp-simple-server) - Free, open-source
2. **Wowza Streaming Engine** - Commercial
3. **Nginx RTMP Module** - Free
4. **FFmpeg + Nginx** - Free, more complex setup

**How it works:**
```
CCTV Camera (RTSP) → Streaming Server → HLS (.m3u8) → Browser
```

**Example Setup with MediaMTX:**
```yaml
# MediaMTX config
paths:
  camera1:
    source: rtsp://192.168.1.100:554/stream1
    sourceOnDemand: yes
```

**Result:**
- RTSP: `rtsp://192.168.1.100:554/stream1`
- HLS: `http://your-server:8888/camera1/index.m3u8`

---

### Option 2: Cloud Streaming Service

Use services that handle RTSP → HLS conversion:

1. **Mux** (what you're using for testing)
2. **Cloudflare Stream**
3. **AWS MediaLive**
4. **Azure Media Services**

**Example with Mux:**
```javascript
// Mux can ingest RTSP and output HLS
// You'll need to configure RTSP input in Mux dashboard
```

---

### Option 3: On-Premise FFmpeg Solution

Convert RTSP to HLS using FFmpeg:

```bash
# FFmpeg command to convert RTSP to HLS
ffmpeg -i rtsp://192.168.1.100:554/stream1 \
  -c:v copy -c:a copy \
  -f hls -hls_time 2 -hls_list_size 3 \
  -hls_flags delete_segments \
  /path/to/output/stream.m3u8
```

**Node.js Implementation:**
```javascript
const { spawn } = require('child_process');
const fs = require('fs');

function convertRTSPtoHLS(rtspUrl, outputPath) {
  const ffmpeg = spawn('ffmpeg', [
    '-i', rtspUrl,
    '-c:v', 'copy',
    '-c:a', 'copy',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments',
    outputPath
  ]);

  return ffmpeg;
}
```

---

## Frontend Code - Make it Flexible

Your frontend should handle both formats:

### Current Code (HLS):
```jsx
<video
  src={camera.streamUrl}
  controls
  autoPlay
  muted
/>
```

### Updated Code (Handles Both):
```jsx
import Hls from 'hls.js';

function CameraStream({ camera }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const streamUrl = camera.streamUrl;

    // Check if it's HLS (.m3u8)
    if (streamUrl.includes('.m3u8') || streamUrl.includes('mux.dev')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = streamUrl;
        video.play();
      }
    } else if (streamUrl.startsWith('rtsp://')) {
      // RTSP - show message that conversion is needed
      console.warn('RTSP streams need to be converted to HLS for web playback');
      // You might want to show a message to user
    } else {
      // Direct video file or other format
      video.src = streamUrl;
      video.play();
    }
  }, [camera.streamUrl]);

  return (
    <video
      ref={videoRef}
      controls
      muted
      className="camera-stream"
    />
  );
}
```

---

## Database Schema - No Changes Needed

Your current `cameras` table already supports this:

```sql
streamUrl VARCHAR -- Can store RTSP or HLS URLs
```

**Recommendation:**
- Store the **final HLS URL** in database (after conversion)
- Keep RTSP URL in a separate field if needed for admin purposes

**Optional Enhancement:**
```javascript
// Add rtspSourceUrl field to cameras table (optional)
{
  streamUrl: 'http://your-server:8888/camera1/index.m3u8', // HLS for browser
  rtspSourceUrl: 'rtsp://192.168.1.100:554/stream1' // Original RTSP (admin only)
}
```

---

## Implementation Strategy

### Phase 1: Current (Testing)
- ✅ Use Mux test stream (HLS)
- ✅ Frontend works with HLS
- ✅ Database stores HLS URLs

### Phase 2: Real CCTV Integration
1. **Set up streaming server** (MediaMTX recommended)
2. **Configure RTSP → HLS conversion**
3. **Update camera streamUrl** in database to HLS endpoint
4. **Frontend code remains the same** (already handles HLS)

### Example Flow:
```
Real CCTV Camera
  ↓ (RTSP: rtsp://192.168.1.100:554/stream1)
MediaMTX Server
  ↓ (Converts to HLS)
HLS Endpoint: http://your-server:8888/karachi-camera1/index.m3u8
  ↓
Database: streamUrl = "http://your-server:8888/karachi-camera1/index.m3u8"
  ↓
Frontend: Uses HLS.js to play
```

---

## Recommended Setup for Production

### 1. MediaMTX Server (Free & Open Source)

**Install:**
```bash
# Download from: https://github.com/bluenviron/mediamtx
# Or use Docker
docker run -p 8888:8888 -p 8554:8554 bluenviron/mediamtx
```

**Configuration:**
```yaml
# mediamtx.yml
paths:
  karachi-camera1:
    source: rtsp://192.168.1.100:554/stream1
    sourceOnDemand: yes
    sourceOnDemandStartTimeout: 10s
    sourceOnDemandCloseAfter: 10s
```

**Result:**
- RTSP Input: `rtsp://192.168.1.100:554/stream1`
- HLS Output: `http://your-server:8888/karachi-camera1/index.m3u8`

### 2. Update Camera in Database

```javascript
// When adding real CCTV camera
await Camera.create({
  warehouseId: warehouseId,
  name: 'Main Entrance Camera',
  streamUrl: 'http://your-server:8888/karachi-camera1/index.m3u8', // HLS URL
  status: 'online'
});
```

### 3. Frontend - No Changes Needed!

Your current frontend code will work because:
- It receives HLS URL from API
- HLS.js handles playback
- Same format as test stream

---

## Testing Real CCTV

### Step 1: Get RTSP URL from CCTV
```
Format: rtsp://username:password@ip:port/path
Example: rtsp://admin:password123@192.168.1.100:554/stream1
```

### Step 2: Set up MediaMTX
```bash
# Run MediaMTX
docker run -p 8888:8888 -p 8554:8554 bluenviron/mediamtx
```

### Step 3: Configure Path
```yaml
paths:
  test-camera:
    source: rtsp://admin:password123@192.168.1.100:554/stream1
```

### Step 4: Test HLS URL
```
http://localhost:8888/test-camera/index.m3u8
```

### Step 5: Update Database
```javascript
// Update camera streamUrl
camera.streamUrl = 'http://your-server:8888/test-camera/index.m3u8';
await camera.save();
```

---

## Summary

**Current Setup:**
- ✅ Using HLS format (.m3u8)
- ✅ Works in browsers
- ✅ Frontend code ready

**Real CCTV Integration:**
- Real CCTV uses RTSP (not browser-compatible)
- Need streaming server to convert RTSP → HLS
- MediaMTX is recommended (free, easy setup)
- After conversion, same HLS format as test stream
- **Frontend code stays the same!**

**Key Point:**
Once RTSP is converted to HLS, your frontend code will work exactly the same. The `.m3u8` format is the same whether it comes from Mux test stream or converted CCTV feed.

---

## Resources

- **MediaMTX:** https://github.com/bluenviron/mediamtx
- **HLS.js:** https://github.com/video-dev/hls.js/
- **FFmpeg RTSP to HLS:** https://ffmpeg.org/ffmpeg-formats.html#hls-2
