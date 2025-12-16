# Chat System Requirements

## Core Features

### Message Functionality
- [ ] Send messages to party chat
- [ ] Send messages to world chat
- [ ] Receive messages in real-time (WebSocket)
- [ ] Message history/scrollback
- [ ] Message timestamps (relative: "2m ago" or absolute)
- [ ] Character limit per message (e.g., 500 chars)
- [ ] Rate limiting (prevent spam - e.g., 1 message per second)
- [ ] Message persistence (store in database)
- [ ] Pagination for loading older messages
- [ ] Message deletion (own messages only)
- [ ] Message editing (own messages only, with edit indicator)

### Chat Channels
- [ ] Party chat (only visible to party members)
- [ ] World chat (visible to all users in browser source)
- [ ] Channel switching/tabs
- [ ] Unread message indicators per channel
- [ ] Active channel indicator

### User Display
- [ ] Display username/Twitch username
- [ ] Display hero name
- [ ] Display hero role/class icon
- [ ] Display founder tier badge (if applicable)
- [ ] User name colors (founder feature)
- [ ] User name frames (founder feature)
- [ ] Level display (optional)
- [ ] Click username to view profile/inspect hero

## Moderation Features

### Blocking
- [ ] Block user (hide all their messages)
- [ ] Unblock user
- [ ] Blocked users list
- [ ] Visual indicator for blocked messages (optional: show "[Blocked User]" placeholder)
- [ ] Block persists across sessions

### Reporting
- [ ] Report user
- [ ] Report specific message
- [ ] Report reasons (spam, harassment, inappropriate content, etc.)
- [ ] Report confirmation/feedback
- [ ] Admin report queue/dashboard
- [ ] Report status tracking

### Muting
- [ ] Mute user (temporary - hide messages for session)
- [ ] Unmute user
- [ ] Muted users list
- [ ] Mute duration options (session, 1 hour, 24 hours)

### Admin Moderation
- [ ] Delete any message
- [ ] Ban user from chat
- [ ] Unban user
- [ ] Temporary mute (admin can mute users)
- [ ] View all messages (admin chat log viewer)
- [ ] View user chat history
- [ ] IP-based banning (if needed)
- [ ] Moderation action logging

### Content Filtering
- [ ] Profanity filter (word list)
- [ ] Spam detection (repeated messages, rapid posting)
- [ ] Link detection (allow/block/require approval)
- [ ] Emoji limits (prevent emoji spam)
- [ ] Caps lock detection (warn/auto-fix excessive caps)
- [ ] Auto-moderation actions (auto-mute after X violations)

## UI/UX Features

### Visual Design
- [ ] Chat container/window
- [ ] Message bubbles or list format
- [ ] Scrollable message area
- [ ] Auto-scroll to bottom on new messages
- [ ] Manual scroll detection (pause auto-scroll when user scrolls up)
- [ ] Scroll to bottom button (when scrolled up)
- [ ] Message input field
- [ ] Send button
- [ ] Character counter
- [ ] Typing indicators (optional: "User is typing...")
- [ ] Connection status indicator (connected/disconnected/reconnecting)
- [ ] Message timestamps (toggle show/hide)
- [ ] Compact/expanded view options

### Notifications
- [ ] Browser notification for mentions (optional)
- [ ] Sound notification (optional, with mute toggle)
- [ ] Visual notification badge (unread count)
- [ ] Notification settings (enable/disable per channel)

### Message Formatting
- [ ] Emoji support
- [ ] Basic markdown (bold, italic, links)
- [ ] @mentions (highlight, notification)
- [ ] Link previews (optional)
- [ ] Image embeds (optional, with moderation)

### User Experience
- [ ] Chat history loading (lazy load older messages)
- [ ] "New messages" indicator when scrolled up
- [ ] Smooth scrolling
- [ ] Message animations (fade in)
- [ ] Responsive design (mobile/desktop)
- [ ] Chat window resize/dock
- [ ] Minimize/maximize chat
- [ ] Chat position (sidebar, bottom, floating)

## Technical Features

### Real-time Communication
- [ ] WebSocket connection
- [ ] Connection management (reconnect on disconnect)
- [ ] Heartbeat/ping to keep connection alive
- [ ] Connection retry logic (exponential backoff)
- [ ] Message queuing (queue messages if offline, send when reconnected)
- [ ] Message acknowledgment
- [ ] Handle connection errors gracefully

### Backend
- [ ] Message storage (Firestore collection)
- [ ] Message indexing (by channel, timestamp, user)
- [ ] Message cleanup (delete old messages after X days)
- [ ] Rate limiting middleware
- [ ] Message validation
- [ ] User authentication/authorization
- [ ] Channel membership validation
- [ ] Message broadcasting (party vs world)

### Performance
- [ ] Message pagination (load 50 messages at a time)
- [ ] Virtual scrolling (for large message lists)
- [ ] Message deduplication
- [ ] Optimistic UI updates
- [ ] Debounce message sending
- [ ] Throttle message updates

### Security
- [ ] Input sanitization (XSS prevention)
- [ ] SQL injection prevention (if using SQL)
- [ ] CSRF protection
- [ ] Rate limiting per user
- [ ] IP-based rate limiting
- [ ] Message encryption (optional, for sensitive chats)

## Data Models

### Message Schema
```typescript
{
  id: string;
  channel: 'party' | 'world';
  userId: string;
  username: string;
  heroName?: string;
  heroRole?: string;
  message: string;
  timestamp: number;
  editedAt?: number;
  deletedAt?: number;
  partyId?: string; // For party chat
  mentions?: string[]; // User IDs mentioned
}
```

### Block Schema
```typescript
{
  userId: string;
  blockedUserId: string;
  blockedAt: number;
}
```

### Report Schema
```typescript
{
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedMessageId?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}
```

### Mute Schema
```typescript
{
  userId: string;
  mutedUserId: string;
  mutedUntil?: number; // Timestamp, null = session only
  mutedAt: number;
}
```

## API Endpoints Needed

### Messages
- `POST /api/chat/send` - Send a message
- `GET /api/chat/history/:channel` - Get message history
- `GET /api/chat/history/party/:partyId` - Get party chat history
- `DELETE /api/chat/message/:messageId` - Delete own message
- `PATCH /api/chat/message/:messageId` - Edit own message

### Moderation
- `POST /api/chat/block` - Block a user
- `DELETE /api/chat/block/:userId` - Unblock a user
- `GET /api/chat/blocks` - Get blocked users list
- `POST /api/chat/report` - Report a user/message
- `GET /api/chat/reports` - Get reports (admin)
- `POST /api/chat/mute` - Mute a user
- `DELETE /api/chat/mute/:userId` - Unmute a user
- `GET /api/chat/mutes` - Get muted users list

### Admin
- `DELETE /api/chat/admin/message/:messageId` - Delete any message (admin)
- `POST /api/chat/admin/ban` - Ban user from chat (admin)
- `DELETE /api/chat/admin/ban/:userId` - Unban user (admin)
- `GET /api/chat/admin/logs` - Get chat logs (admin)

## WebSocket Events

### Client → Server
- `chat:send` - Send a message
- `chat:typing` - User is typing (optional)
- `chat:join` - Join a channel
- `chat:leave` - Leave a channel

### Server → Client
- `chat:message` - New message received
- `chat:message:edited` - Message was edited
- `chat:message:deleted` - Message was deleted
- `chat:user:joined` - User joined channel
- `chat:user:left` - User left channel
- `chat:typing` - User is typing (optional)
- `chat:error` - Error occurred

## Implementation Priority

### Phase 1: MVP (Core Functionality)
1. Basic message sending/receiving
2. Party chat
3. World chat
4. WebSocket connection
5. Message history
6. Basic UI

### Phase 2: Essential Features
1. Block users
2. Report users/messages
3. Rate limiting
4. Message deletion
5. Admin message deletion
6. Connection status

### Phase 3: Enhanced UX
1. Message editing
2. Typing indicators
3. Notifications
4. Mute users
5. Unread indicators
6. Message timestamps

### Phase 4: Moderation & Safety
1. Profanity filter
2. Spam detection
3. Admin ban system
4. Report queue
5. Content filtering
6. Auto-moderation

### Phase 5: Advanced Features
1. @mentions
2. Message formatting
3. Link previews
4. Chat history search
5. User profiles from chat
6. Advanced admin tools

## Considerations

### Scalability
- How many concurrent users?
- Message volume per second?
- Database storage limits?
- Message retention policy (delete after X days?)

### Cost
- Firestore read/write costs
- WebSocket connection costs
- Storage costs for message history

### Privacy
- Should messages be encrypted?
- Data retention policy
- GDPR compliance (if applicable)

### Performance
- Message delivery latency
- History loading speed
- Real-time update frequency

## Notes

- Start with MVP and iterate
- Consider using a chat service (Pusher, PubNub) vs building from scratch
- WebSocket libraries: Socket.io, ws, or Firebase Realtime Database
- Consider message queue system for high volume
- Implement proper error handling and fallbacks
- Add analytics for message volume, user engagement








