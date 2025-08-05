# DEPRECATED WebSocket Implementation

The following files are part of the old WebSocket implementation and should NOT be used:

- `useWebSocket.ts` - Replaced by WebSocketManager
- `useRealtimeIntegration.ts` - Replaced by RealtimeProvider

## Migration Guide

### Old Usage:
```typescript
import {useRealtimeIntegration} from './hooks/useRealtimeIntegration';

const {connectionStatus} = useRealtimeIntegration();
if (connectionStatus === 'Connected') { /* ... */ }
```

### New Usage:
```typescript
import {useRealtime} from './providers/RealtimeProvider';

const {connectionStatus} = useRealtime();
if (connectionStatus === 'CONNECTED') { /* ... */ }
```

## Key Changes:
1. Connection states are now uppercase: `'CONNECTED'`, `'CONNECTING'`, etc.
2. WebSocket is managed by a singleton WebSocketManager
3. Error boundaries prevent app crashes
4. Better reconnection logic with exponential backoff

These files are kept temporarily for reference but will be removed soon.