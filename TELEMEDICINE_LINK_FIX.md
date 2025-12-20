# Telemedicine Link Fix

## Issue

The telemedicine session link is not working because it's using a placeholder URL (`https://meet.clinic.com/room-${session.id}`) which is not a real video call service.

## Current Implementation

The link is generated in two places:
1. Frontend: `startSession()` function generates `https://meet.clinic.com/room-${session.id}`
2. Backend: PATCH endpoint generates the same placeholder URL

## Solutions

### Option 1: Quick Fix - Make Link Clickable (Implemented)

I've updated the UI to:
- Make the session URL clickable
- Add a warning message that it's a placeholder
- Open link in new tab

**Status**: ✅ Implemented

### Option 2: Integrate Real Video Provider (Recommended)

You need to integrate a real video call provider. Here are the best options:

#### A. Daily.co (Easiest - Recommended)
- Free tier available
- Easy integration
- Good documentation
- HIPAA-compliant options

**Steps**:
1. Sign up at https://www.daily.co/
2. Get API key
3. Install: `npm install @daily-co/daily-js`
4. Create rooms via API
5. Generate join URLs

#### B. Jitsi Meet (Free & Open Source)
- Completely free
- Self-hosted option
- No API key needed
- Good for development

**Steps**:
1. Use public Jitsi: `https://meet.jit.si/room-${sessionId}`
2. Or self-host for production

#### C. Zoom Healthcare (HIPAA-Compliant)
- Enterprise solution
- Healthcare-focused
- Requires Zoom account

#### D. Twilio Video (Customizable)
- Pay-per-use
- Highly customizable
- Good for custom solutions

## Implementation Guide for Daily.co

### 1. Install Daily.co SDK

```bash
npm install @daily-co/daily-js
```

### 2. Create Daily.co Service

Create `server/services/daily-co.ts`:

```typescript
import Daily from '@daily-co/daily-js';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const dailyClient = Daily(DAILY_API_KEY);

export async function createDailyRoom(sessionId: number): Promise<string> {
  try {
    const room = await dailyClient.rooms.create({
      name: `telemedicine-${sessionId}`,
      privacy: 'private',
      properties: {
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: false, // Enable if needed
      }
    });

    return room.url;
  } catch (error) {
    console.error('Failed to create Daily.co room:', error);
    throw error;
  }
}

export async function getDailyRoomToken(roomName: string, isOwner: boolean): Promise<string> {
  try {
    const token = await dailyClient.meetingTokens.create({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2 hours
      }
    });

    return token.token;
  } catch (error) {
    console.error('Failed to create Daily.co token:', error);
    throw error;
  }
}
```

### 3. Update Backend Routes

In `server/routes.ts`, update the PATCH endpoint:

```typescript
// Add import
import { createDailyRoom } from './services/daily-co';

// In PATCH endpoint, replace placeholder URL generation:
if (updateData.status === 'active' && !updateData.sessionUrl && !existingSession.sessionUrl) {
  try {
    const roomUrl = await createDailyRoom(sessionId);
    updateData.sessionUrl = roomUrl;
  } catch (error) {
    console.error('Failed to create video room:', error);
    // Fallback to placeholder or return error
    return res.status(500).json({ 
      message: "Failed to create video session",
      error: "Video provider unavailable"
    });
  }
}
```

### 4. Update Frontend

Create `client/src/components/daily-video.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyVideoProps {
  roomUrl: string;
  token?: string;
  onLeave?: () => void;
}

export function DailyVideo({ roomUrl, token, onLeave }: DailyVideoProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const callFrameRef = useRef<any>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const callFrame = DailyIframe.createFrame(iframeRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
      },
    });

    callFrameRef.current = callFrame;

    callFrame.join({ url: roomUrl, token });

    callFrame.on('left-meeting', () => {
      onLeave?.();
    });

    return () => {
      callFrame.leave();
    };
  }, [roomUrl, token, onLeave]);

  return (
    <div className="w-full h-full">
      <iframe ref={iframeRef} className="w-full h-full" />
    </div>
  );
}
```

### 5. Update Telemedicine Page

Replace the placeholder video interface:

```typescript
import { DailyVideo } from '@/components/daily-video';

// In the active session view:
{selectedSession.sessionUrl ? (
  <DailyVideo 
    roomUrl={selectedSession.sessionUrl}
    onLeave={() => endSession(selectedSession)}
  />
) : (
  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
    <p>Loading video session...</p>
  </div>
)}
```

### 6. Environment Variables

Add to `.env`:

```bash
DAILY_API_KEY=your_daily_api_key_here
```

## Quick Fix Using Jitsi (No API Key Needed)

For a quick solution without API keys, you can use Jitsi Meet:

### Update Backend

```typescript
// In PATCH endpoint:
if (updateData.status === 'active' && !updateData.sessionUrl && !existingSession.sessionUrl) {
  // Use Jitsi Meet public instance
  updateData.sessionUrl = `https://meet.jit.si/telemedicine-${sessionId}-${Date.now()}`;
}
```

### Update Frontend

```typescript
// Replace video interface with Jitsi iframe:
{selectedSession.sessionUrl && (
  <iframe
    src={selectedSession.sessionUrl}
    allow="camera; microphone; fullscreen; speaker; display-capture"
    style={{ width: '100%', height: '100%', border: 'none' }}
    className="rounded-lg"
  />
)}
```

## Testing

1. **Test Daily.co Integration**:
   - Create a session
   - Start the session
   - Verify room URL is generated
   - Join the room from both doctor and patient side

2. **Test Jitsi Integration**:
   - Create a session
   - Start the session
   - Verify Jitsi URL is generated
   - Test video/audio functionality

## Current Status

✅ **Quick Fix Applied**: Link is now clickable with warning message
⏳ **Real Integration**: Pending - Choose provider and implement

## Recommendation

For production, I recommend:
1. **Daily.co** - Best balance of ease and features
2. **Jitsi Meet** - Quick free solution for development
3. **Zoom Healthcare** - If you need enterprise/HIPAA compliance

Choose based on your needs and budget.

