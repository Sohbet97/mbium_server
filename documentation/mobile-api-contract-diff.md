# Backend API Contract (mbium mobile) — diff against current `backend/`

Source artifact: "Backend API Contract" from mobile client (Flutter) team, status
"Финал — согласовано, готово в разработку" (final, agreed, ready for dev).
This note checks each claim in that document against the actual code in this repo
as of 2026-09-09, and flags where the contract's "as it is now" description doesn't
match, or where implementation needs a decision beyond "just build the endpoint".

## 1. SMS-code login

**Contract says:** login/register issue a `session_id` that both funnel into
`POST /auth/verify-otp`; new scheme replaces this with phone-only
`POST /auth/request-otp` → `POST /auth/verify-otp({phone_number, otp})`.

**Matches code exactly:**
- `routes/auth/auth.js` has `/login`, `/register`, `/verify-otp`, `/resend-otp`,
  `/refresh` — no `/request-otp`. Confirms "endpoint doesn't exist yet."
- `UserController.verifyOtp` body is literally `{ session_id, otp }` today
  (`__modules__/user/controllers/user-controller.js:244`) — matches the "Было" block.
- `UserService`: `OTP_TTL_MINUTES = 5` (300s) and `OTP_MAX_ATTEMPTS = 5`
  (`__modules__/user/services/users.js:15-16`) — matches the proposed
  `code_ttl_seconds: 300` and the "5 attempts" agreement exactly. 6-digit OTP
  confirmed in `_generateOtp()`.
- `PATCH /auth/me/device-token` already exists (`routes/auth/auth.js`) — the
  doc's claim that FCM registration "already works" is correct, no gap there.

**Real discrepancies to flag back to mobile:**
- **Phone format.** The contract's examples use E.164 (`+99361234567`, 12 chars).
  The actual `User` model field is `phone_number: STRING(8)` validated against
  `TM_PHONE_REGEX = /^(6[1-5]|71)\d{6}$/` — i.e. **local 8-digit format with no
  `+993` prefix and no `+`**. Either the new endpoints need to strip/normalize
  the country code server-side, or mobile needs to send the bare 8-digit number.
  This needs an explicit decision before `request-otp`/`verify-otp` are built.
- **Response shape.** `verify-otp` currently returns `{ token, user, is2FA: false }`
  via `_issueTokenResponse()` — **no `refreshToken` in the JSON body.** The
  refresh token is set as an httpOnly cookie only
  (`res.cookie('refreshToken', ...)`, `user-controller.js:577`). The contract's
  example response includes `"refreshToken": "8f2a1c9e..."` in the body, which
  a mobile app needs (it can't read httpOnly cookies) — this is a real change,
  not just wiring up a new route.
- **User object shape.** The DTO used for this response
  (`backend/dtos/user.js` → `UserDTO`) is a generic/admin-style DTO with fields
  like `role`, `position`, `department`, `assignment_id`, `permissions` —
  clearly built for the admin/HIS side of the codebase, not a buyer-facing
  shape. It does **not** cleanly produce the contract's
  `{id, email, name, surname, phone_number, avatar}`. A buyer-specific DTO (or
  reuse of `dtos/user_short.js` — check it fits) is needed either way.
- `/auth/resend-otp` today takes `{session_id}`, matches the doc's "Было".

## 2. Top-20 shops

**Contract says:** "Top sellers" screen reuses `GET /catalog/shops` today, with
no server-side rating sort and no aggregate counts; needs a new
`GET /catalog/shops/top`.

**Matches code exactly:**
- `GET /buyer/catalog/shops` (`routes/buyer/catalog.js:153`) sorts via
  `resolveShopSort()` = turbo-boost flag, then `SHOP_CONSTANTS.DEFAULT_SORT`
  (`[order, name]`) — **no rating sort at all**, confirming "место в списке
  считается на клиенте" is accurate.
- Response is `{ data, count }` (offset pagination), not a bare sorted array —
  a new endpoint is indeed cleaner than overloading this one.
- No `total_orders` / `total_reels` / `total_comments` / `total_product_favorites`
  exist anywhere in the shops/orders/reels/comments/favorites modules today —
  confirmed by grep, nothing to reuse.
- `Shop.rating` is `DECIMAL(3,2)` (`models/Shop.model.js:120`). Sequelize/pg
  returns `DECIMAL` columns as **strings** by default — this is exactly why
  `/catalog/shops` gives `rating` as a string and why the contract explicitly
  calls out "rating — число, не строка" as a requirement for the new endpoint.
  Needs an explicit cast (e.g. `CAST(rating AS FLOAT)` or `parseFloat` after
  fetch) in the new query — easy to forget since the existing shop serializer
  doesn't do this anywhere.

**Implementation note (not a contract gap, just scope):**
- `total_orders` and `total_reels` are one join away — `Order.shop_id` and
  `Reel.shop_id` are direct columns (`orders/models/Order.model.js`,
  `reels/models/Reel.model.js`).
- `total_comments` and `total_product_favorites` are **not** — `Comment` and
  `Favorite` only carry `product_id`, so both require joining through
  `Product.shop_id` (`comments/models/Comment.model.js`,
  `favorites/models/Favorite.model.js`). Four separate aggregate
  subqueries/joins, not one simple `GROUP BY`; worth knowing before quoting a
  time estimate for the 500 "aggregation error" case.

## 3. Chats

**Contract says:** "Чат-бэкенда не существует — реализуется с нуля" (chat
backend doesn't exist, build from scratch) for all six new endpoints + WS.

**This is only half true — there's more reusable backend here than the doc assumes:**

- The data model already exists and matches what the contract needs almost
  exactly: `chat_rooms`, `chat_room_participants`, `chat_messages`,
  `chat_message_reads` (`backend/models/ChatRoom.js`, `ChatRoomParticipant.js`,
  `ChatMessage.js`, `ChatMessageRead.js`). `ChatMessageRead` (per-message,
  per-user read receipts) is defined but **not currently used anywhere** — it's
  exactly the primitive the contract's `status: sent/delivered/read` needs.
- There's a **working seller-support chat** today:
  `routes/seller/support.js` (`GET /seller/support/room`, `GET|POST
  /seller/support/messages`) and `routes/admin/support.js` (admin side),
  built on the same models, using `ChatRoom.type = 1` for "support" rooms and
  `ChatRoomParticipant.role` to distinguish seller (1) vs. admin (2). Real-time
  delivery already works via Socket.IO: `io.to(String(userId)).emit('support-message', ...)`,
  and the socket server already keys rooms by user id
  (`onlineUsers[userId] = socket.id` in `index.js`).
- **But** none of this is buyer-facing or shop/product-aware: no `shop_id` /
  `product_id` column on `chat_rooms`, no buyer routes mounted anywhere in
  `routes/buyer/index.js` (there is no `/buyer/chats` at all), no attachment
  support, no cursor pagination (existing support chat uses `page`/`limit`,
  not the contract's opaque cursor), and delivery is a **named Socket.IO
  event**, not the generic `WS /chats/ws` + `{event: "message.new", ...}`
  envelope the contract specifies.
- There's a **separate, dead** `routes/admin/chatroom.js` that is not mounted
  in `routes/admin/index.js` at all, and it doesn't even match the current
  models — it references columns like `participants` (array), `target`,
  `read`, `chatroom` that don't exist on the current `ChatRoom`/`ChatMessage`
  schema (which uses `chatroom_id`, join tables, etc.). It looks like leftover
  code from an earlier version of the chat feature and would throw if it were
  ever wired up. Worth deleting rather than resurrecting.

**Net for backend team:** this is not a from-scratch build. The realistic
scope is: add `type`/`shop_id`/`product_id` to `chat_rooms` (or a parallel
table), write the six buyer-facing routes against the existing
`ChatRoom`/`ChatMessage`/`ChatMessageRead` models, add the attachment upload
endpoint, and either (a) expose the existing Socket.IO channel as `/chats/ws`
with the contract's generic event envelope, or (b) push back on mobile to use
the existing `support-message`-style named events instead of a generic `WS`
contract. That's a meaningfully smaller lift than "chat backend doesn't
exist", and reusing `ChatMessageRead` avoids inventing per-message status
tracking from zero.

## 4. Brand logo in products

**Contract says:** add `brand_logo` next to `brand_id` in
`GET /buyer/catalog/products` (list) and `GET /catalog/products/{id}` (detail).

**Matches code, with an asymmetry the doc doesn't mention:**
- `Brand.model.js` has `logo_url` (`TEXT`, nullable) — confirms "лого бренда
  есть в модели бренда" exactly.
- **Detail** endpoint (`ProductService.getById`,
  `__modules__/catalog/services/products.js`) already `include`s
  `{ model: db.Brand, as: 'brand', required: false }` — the logo is already
  being fetched, just nested as `brand.logo_url` instead of a flat
  `brand_logo` field next to `brand_id`. This is a response-flattening change,
  not a new join.
- **List** endpoint (`ProductService.get()`, same file, used by both
  `GET /buyer/catalog/products` and `GET /buyer/catalog/shops/:id/products`)
  has **no Brand include at all** today. This one needs an actual new join
  added to the list query (with `attributes: ['id', 'logo_url']` to avoid
  pulling the whole brand row for every product), not just reshaping existing
  data. Worth noting since the contract describes both endpoints as the same
  size of change, but the list endpoint is strictly more work than the detail
  endpoint.

## Reference section ("Вне рамок" / client-side changes)

Nothing to verify against this backend — those are Flutter-side files
(`person_repository.dart`, `chat_screen.dart`, etc.) with no backend
counterpart to diff.

## Summary of things worth raising with the mobile team before starting work

1. Phone number format mismatch (E.164 vs. local 8-digit `TM_PHONE_REGEX`) —
   needs a decision, affects `request-otp`, `verify-otp`, and the `phone_number`
   field in every response.
2. `refreshToken` isn't in any current JSON auth response body (cookie-only) —
   confirm mobile actually needs it in the body (it does, per the contract) so
   this is called out explicitly as a behavior change, not just a new route.
3. There's a real, working seller-support chat system already
   (models + Socket.IO delivery) that the new buyer chat should probably
   extend rather than duplicate — worth a conversation before scoping "build
   chat from scratch" as 1-of-3 independent-effort items.
4. `total_comments` / `total_product_favorites` for the shops-top endpoint
   require joining through `Product`, not a direct `shop_id` column like
   orders/reels — slightly more aggregation work than orders/reels.
5. `rating` must be explicitly cast to a number for the new shops-top endpoint
   (Sequelize returns `DECIMAL` as a string by default — this is why the old
   endpoint has the exact bug the contract is calling out).
