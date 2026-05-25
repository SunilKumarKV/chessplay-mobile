# Social and Profile Parity

This document tracks the mobile implementation against the existing ChessPlay web/backend social surfaces.

## APIs Used

- `GET /api/profile/me` loads the signed-in profile, rating, games summary, profile metadata, privacy fields, and recent games.
- `PATCH /api/profile/me` updates username, bio, and country.
- `GET /api/profile/:username` loads public player profiles when visibility allows it.
- `POST /api/auth/avatar` uploads an avatar using `imageDataUrl`.
- `DELETE /api/auth/avatar` removes the current avatar.
- `GET /api/auth/friends` loads friends and incoming friend requests.
- `GET /api/auth/users/search?q=` searches users for friend discovery.
- `POST /api/auth/friends/request` sends a friend request.
- `POST /api/auth/friends/respond` accepts or declines a request.
- `GET /api/messages/users/search?q=` searches messageable users.
- `GET /api/messages/conversations` loads private conversations.
- `POST /api/messages/conversations` opens or creates a private conversation.
- `GET /api/messages/conversations/:id/messages` loads a conversation and recent messages.
- `POST /api/messages/conversations/:id/messages` sends a message.
- `PATCH /api/messages/conversations/:id/read` marks a conversation read.
- `GET /api/social/community/posts` lists public community posts.
- `POST /api/social/community/posts` creates a community post.
- `POST /api/social/community/posts/:id/like` toggles a like.
- `POST /api/social/community/posts/:id/comments` adds a comment.
- `GET /api/social/messaging/bootstrap` loads public rooms.
- `POST /api/social/messaging/open` opens public rooms.

## Socket Events Used

- `socialUserStatus` updates online/offline badges when the backend broadcasts presence.
- `joinConversation` and `leaveConversation` subscribe/unsubscribe to conversation rooms.
- `socialTyping` sends and receives typing indicators.
- `socialMessage` invalidates active message queries when another client sends through the socket path.

## Implemented Mobile Features

- Own profile with avatar, display name, title/badge, country, rating, games, win/loss/draw stats, puzzle stats, bio, and recent games.
- Profile edit with username, country, bio, avatar upload, and avatar delete.
- Public profile screen opened from search and friends.
- Friends list, incoming request accept/decline, user search, send request, open profile, and start conversation.
- Conversations list with unread counts and public room entry points.
- Conversation detail with message sending, mark-read, polling refresh, socket refresh, typing indicator, and max length feedback.
- Community post list, create post, like/unlike, and comments.
- Settings parity for privacy, notifications, appearance, and gameplay settings using `GET/PATCH /settings/me`.
- Presence badges where `socialUserStatus` is available.

## Missing Backend/Mobile Gaps

- There is no dedicated outgoing friend request list endpoint in the current contract; search results expose pending state per user.
- Message delivery receipts beyond read state are not exposed.
- Push notifications and device token registration are still missing.
- Avatar upload currently uses base64 image data. A multipart upload endpoint would be better for large production images.
- Community moderation/status updates are admin-only on backend and intentionally not exposed in mobile.
- Public profile lookup is username-based; direct id lookup is only available through older auth profile routes and is not used by mobile.
- Presence depends on users being connected to Socket.IO and broadcasting `socialUserStatus`; it should be treated as best-effort.

## Manual Tests

1. Sign in and open Profile. Confirm rating, games, puzzle stats, bio, and recent games load.
2. Edit username, country, and bio. Save and confirm Profile refreshes.
3. Pick an avatar from the photo library. Confirm permission prompt, upload success, and avatar display.
4. Delete avatar and confirm fallback initial display.
5. Open Social, search for a user, send a friend request, and verify pending state.
6. On another account, accept/decline the request and verify the friends list updates.
7. Open a public profile from search or friends and start a message conversation.
8. Send messages in conversation detail and confirm mark-read/unread behavior.
9. With two clients in the same conversation, confirm polling/socket refresh shows new messages and typing indicators where socket is connected.
10. Open Community, create a discussion post, like it, and add a comment.
11. Open Settings and update privacy, notification, appearance, and gameplay fields. Restart the app and confirm synced settings load.
