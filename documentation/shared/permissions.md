# Permissions Registry

**File:** `backend/utils/permissions.js`

Every protected route is guarded by `routeGuard({ GET: N, POST: N, PUT: N, DELETE: N })`. A user's role must include the corresponding permission ID in its `permissions` array to pass the guard.

---

## Permission Table

| ID | Constant | Category | HTTP Method |
|----|----------|----------|-------------|
| 1 | `ROLE_GET` | Roles | GET |
| 2 | `ROLE_POST` | Roles | POST |
| 3 | `ROLE_PUT` | Roles | PUT |
| 4 | `ROLE_DELETE` | Roles | DELETE |
| 5 | `USER_GET` | Users | GET |
| 6 | `USER_POST` | Users | POST |
| 7 | `USER_PUT` | Users | PUT |
| 8 | `USER_DELETE` | Users | DELETE |
| 9 | `USER_POSITION_GET` | Positions | GET |
| 10 | `USER_POSITION_POST` | Positions | POST |
| 11 | `USER_POSITION_PUT` | Positions | PUT |
| 12 | `USER_POSITION_DELETE` | Positions | DELETE |
| 13 | `REGION_GET` | Geography | GET |
| 14 | `REGION_POST` | Geography | POST |
| 15 | `REGION_PUT` | Geography | PUT |
| 16 | `REGION_DELETE` | Geography | DELETE |
| 17 | `VILLAGE_GET` | Geography | GET |
| 18 | `VILLAGE_POST` | Geography | POST |
| 19 | `VILLAGE_PUT` | Geography | PUT |
| 20 | `VILLAGE_DELETE` | Geography | DELETE |
| 21 | `COUNTRY_GET` | Geography | GET |
| 22 | `COUNTRY_POST` | Geography | POST |
| 23 | `COUNTRY_PUT` | Geography | PUT |
| 24 | `COUNTRY_DELETE` | Geography | DELETE |
| 25 | `CATEGORY_GET` | Catalog | GET |
| 26 | `CATEGORY_POST` | Catalog | POST |
| 27 | `CATEGORY_PUT` | Catalog | PUT |
| 28 | `CATEGORY_DELETE` | Catalog | DELETE |
| 29 | `PRODUCT_GET` | Catalog | GET |
| 30 | `PRODUCT_POST` | Catalog | POST |
| 31 | `PRODUCT_PUT` | Catalog | PUT |
| 32 | `PRODUCT_DELETE` | Catalog | DELETE |
| 33 | `ORDER_GET` | Orders | GET |
| 34 | `ORDER_POST` | Orders | POST |
| 35 | `ORDER_PUT` | Orders | PUT |
| 36 | `ORDER_DELETE` | Orders | DELETE |
| 37 | `REVIEW_GET` | Reviews | GET |
| 38 | `REVIEW_POST` | Reviews | POST |
| 39 | `REVIEW_PUT` | Reviews | PUT |
| 40 | `REVIEW_DELETE` | Reviews | DELETE |
| 41 | `DISCOUNT_GET` | Discounts | GET |
| 42 | `DISCOUNT_POST` | Discounts | POST |
| 43 | `DISCOUNT_PUT` | Discounts | PUT |
| 44 | `DISCOUNT_DELETE` | Discounts | DELETE |
| 45 | `BANNER_GET` | Banners | GET |
| 46 | `BANNER_POST` | Banners | POST |
| 47 | `BANNER_PUT` | Banners | PUT |
| 48 | `BANNER_DELETE` | Banners | DELETE |
| 49 | `SHOP_MEMBER_GET` | Shop Members | GET |
| 50 | `SHOP_MEMBER_POST` | Shop Members | POST |
| 51 | `SHOP_MEMBER_PUT` | Shop Members | PUT |
| 52 | `SHOP_MEMBER_DELETE` | Shop Members | DELETE |
| 53 | `PAYOUT_GET` | Payouts | GET |
| 54 | `PAYOUT_POST` | Payouts | POST |
| 55 | `PAYOUT_PUT` | Payouts | PUT |
| 56 | `PAYOUT_DELETE` | Payouts | DELETE |
| 57–60 | *(reserved)* | Logistics / Shipping | — |
| 61–64 | *(reserved)* | KYC / Verification | — |
| 65 | `DISPUTE_GET` | Disputes | GET |
| 66 | `DISPUTE_POST` | Disputes | POST |
| 67 | `DISPUTE_PUT` | Disputes | PUT |
| 68 | `DISPUTE_DELETE` | Disputes | DELETE |

> Next available IDs start at **69**. Always use sequential integers — never reuse or skip IDs.

---

## Special Permissions

| ID | Constant | Description |
|----|----------|-------------|
| 309 | `USER_LOGIN_AS` | Allows an admin to force-login as another user |

---

## How Permissions Work

1. Each `Role` stores a `permissions` array of integer IDs (e.g., `[1, 5, 25, 29]`)
2. `routeGuard` extracts the HTTP method from the request and looks up the required permission ID
3. The middleware checks if the authenticated user's role includes that ID
4. If not, `ApiError.NotAllowed()` is thrown → `403 Forbidden`

```js
// Example: protecting a module
routeGuard({
    GET: Permissions.PRODUCT_GET,    // 29
    POST: Permissions.PRODUCT_POST,  // 30
    PUT: Permissions.PRODUCT_PUT,    // 31
    DELETE: Permissions.PRODUCT_DELETE, // 32
})
```

---

## Shop Management Permissions

Note: Shop-level permissions currently use the `WM_*` constants (Warehouse Management) defined elsewhere. The discounts, banners, and reviews modules use their own dedicated constants above.
