# MCP Implementation Plan

*Last updated: 2026-05-26*

---

## Overview

Model Context Protocol (MCP) is an open standard by Anthropic that formalizes how AI assistants connect to external tools and data sources. For Embium, MCP replaces ad-hoc prompt engineering with a structured, typed tool layer — the AI can query real platform data instead of guessing from conversation history.

**What this unlocks:**
- Sellers asking "What are my top 5 products this month?" → AI fetches live analytics
- Admin asking "Are there any shops pending verification?" → AI queries the DB
- AI proactively warning "Warehouse #2 has 3 products below reorder threshold"
- Buyer product recommendations based on order history and browsing

The existing AI module (`backend/__modules__/ai/`) handles chat; MCP becomes the structured data access layer beneath it.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (AI Chat Panel)                   │
│  POST /seller/ai/chat  or  /admin/ai/chat   │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│  AI Controller  (backend/__modules__/ai/)   │
│  - builds system prompt with user context   │
│  - sends messages + tool definitions to LLM │
│  - executes tool calls → MCP Tool Router    │
│  - streams final response back              │
└───────────────┬─────────────────────────────┘
                │  tool calls
┌───────────────▼─────────────────────────────┐
│  MCP Tool Router  (backend/__modules__/mcp/)│
│  - validates tool name + args               │
│  - enforces role-scoped access              │
│  - delegates to platform services           │
└───────────────┬─────────────────────────────┘
                │
       existing platform services
  (OrderService, AnalyticsService, etc.)
```

**Transport**: HTTP-embedded (not stdio). The MCP server is a module inside the Express app, not a separate process. Tool calls are dispatched synchronously within the same Node.js process — no network hop, no extra auth.

**LLM**: Claude Sonnet 4.x via Anthropic SDK (replace current Gemini call). Claude's native tool-use API maps directly to MCP tool definitions.

---

## Phase Plan

### Phase MCP-1 — Foundation *(2–3 days)*

Set up the MCP module, Anthropic SDK, and the first handful of read-only tools. Seller AI chat works end-to-end.

### Phase MCP-2 — Full Tool Coverage *(3–4 days)*

Add remaining domain tools: warehouse, analytics, coins, reviews. Admin-scoped tools.

### Phase MCP-3 — Write Tools *(2 days)*

Destructive/mutating tools: update order status, restock request, approve/reject actions. Require explicit confirmation prompt in UI before execution.

### Phase MCP-4 — Resources & Context Injection *(1–2 days)*

MCP Resources: structured read-only context injected into every chat (shop summary, active promotions, low-stock alerts).

---

## Dependencies

```bash
npm install @anthropic-ai/sdk          # LLM with native tool-use
npm install zod                         # tool argument validation
```

Remove or make optional the current Gemini dependency once MCP-1 is working.

---

## Module Structure

```
backend/__modules__/mcp/
├── index.js                  # exports MCPRouter
├── registry.js               # central tool registry: name → handler
├── router.js                 # MCPRouter.call(toolName, args, context)
├── context.js                # MCPContext type: { userId, role, shopId }
├── tools/
│   ├── catalog.tools.js      # get_products, get_product, get_categories
│   ├── orders.tools.js       # get_orders, get_order, update_order_status
│   ├── analytics.tools.js    # get_sales_summary, get_top_products
│   ├── warehouse.tools.js    # get_inventory, get_low_stock
│   ├── shop.tools.js         # get_shop_info, get_shop_members
│   ├── coins.tools.js        # get_coin_balance, get_coin_history
│   └── admin.tools.js        # admin-only: list_shops, list_users, platform_stats
└── resources/
    └── shop.resource.js      # structured shop context block
```

---

## Tool Definitions

Each tool has a `name`, `description`, `inputSchema` (Zod), `roles` (who can call it), and a `handler(args, ctx)` function.

### Catalog Tools

**`get_products`**
- Roles: `seller`, `admin`
- Args: `{ search?: string, category_id?: number, limit?: number, page?: number }`
- Seller: scoped to `ctx.shopId`. Admin: all products.
- Returns: `[{ id, name, price, stock, status }]`

**`get_product`**
- Roles: `seller`, `admin`, `buyer`
- Args: `{ product_id: number }`
- Returns: full product with variants, images, category, brand

**`get_categories`**
- Roles: all
- Args: `{ parent_id?: number }`
- Returns: category tree nodes

---

### Order Tools

**`get_orders`**
- Roles: `seller`, `admin`, `buyer`
- Args: `{ status?: number, limit?: number, page?: number, date_from?: string, date_to?: string }`
- Seller: own shop orders. Buyer: own orders. Admin: all.
- Returns: `[{ id, status, total_price, created_at, item_count }]`

**`get_order`**
- Roles: `seller`, `admin`, `buyer`
- Args: `{ order_id: number }`
- Enforces ownership check before returning.

**`update_order_status`** *(Phase MCP-3)*
- Roles: `seller`, `admin`
- Args: `{ order_id: number, new_status: number, note?: string }`
- Validates status transition is legal before calling `OrderService.updateStatus`.
- Requires write permission flag `allowWrites: true` on MCPContext.

---

### Analytics Tools

**`get_sales_summary`**
- Roles: `seller`, `admin`
- Args: `{ period: 'today'|'week'|'month'|'year', shop_id?: number }`
- Returns: `{ revenue, order_count, avg_order_value, refund_count }`

**`get_top_products`**
- Roles: `seller`, `admin`
- Args: `{ limit?: number, period?: string }`
- Returns: `[{ product_id, name, units_sold, revenue }]`

**`get_platform_stats`** *(admin only)*
- Roles: `admin`
- Args: `{ period?: string }`
- Returns: `{ total_shops, new_shops, total_orders, gmv, active_users }`

---

### Warehouse Tools

**`get_inventory`**
- Roles: `seller`, `admin`
- Args: `{ warehouse_id?: number, search?: string, low_stock_only?: boolean }`
- Returns: `[{ product_name, sku, quantity, reorder_point, warehouse_name }]`

**`get_low_stock_alerts`**
- Roles: `seller`, `admin`
- Args: `{}`
- Returns: products where `quantity <= reorder_point` in seller's warehouses

---

### Shop Tools

**`get_shop_info`**
- Roles: `seller`, `admin`
- Args: `{ shop_id?: number }` — seller uses own shop if omitted
- Returns: shop profile, subscription plan, verification status

**`get_shop_members`**
- Roles: `seller`, `admin`
- Args: `{ shop_id?: number }`
- Returns: `[{ user_name, role, joined_at }]`

---

### Coin Tools *(after Phase L)*

**`get_coin_balance`**
- Roles: `buyer`, `admin`
- Args: `{ user_id?: string }` — buyer uses own; admin can query any
- Returns: `{ balance, total_earned, total_spent }`

**`get_coin_history`**
- Roles: `buyer`, `admin`
- Args: `{ limit?: number, page?: number }`
- Returns: paginated transaction log

---

### Admin-only Tools

**`list_pending_shops`**
- Args: `{}`
- Returns: shops with `status = PENDING_VERIFICATION`

**`list_users`**
- Args: `{ search?: string, role?: string, limit?: number }`
- Returns: paginated user list

---

## MCPRouter Implementation

**File**: `backend/__modules__/mcp/router.js`

```javascript
const registry = require('./registry');
const ApiError = require('../../utils/ApiError');

class MCPRouter {
  static async call(toolName, args, ctx) {
    const tool = registry.get(toolName);
    if (!tool) throw ApiError.NotFound(`Unknown tool: ${toolName}`);

    if (!tool.roles.includes(ctx.role))
      throw ApiError.Forbidden(`Tool '${toolName}' not available for role '${ctx.role}'`);

    const parsed = tool.schema.safeParse(args);
    if (!parsed.success)
      throw ApiError.BadRequest(parsed.error.message);

    return tool.handler(parsed.data, ctx);
  }

  // Returns Anthropic-format tool definitions for the system prompt
  static getToolDefinitions(role) {
    const defs = [];
    for (const [name, tool] of registry.entries()) {
      if (tool.roles.includes(role)) {
        defs.push({
          name,
          description: tool.description,
          input_schema: tool.inputSchema
        });
      }
    }
    return defs;
  }
}

module.exports = MCPRouter;
```

---

## AI Controller Integration

**File**: `backend/__modules__/ai/services/ai.js` (update existing)

Core loop — uses Anthropic SDK's native tool-use:

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const MCPRouter = require('../../mcp/router');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

async function chat(messages, ctx) {
  const tools = MCPRouter.getToolDefinitions(ctx.role);

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: buildSystemPrompt(ctx),
    tools,
    messages,
  });

  // Agentic loop: keep running until no more tool calls
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const toolResults = [];

    for (const block of toolUseBlocks) {
      let result;
      try {
        result = await MCPRouter.call(block.name, block.input, ctx);
      } catch (err) {
        result = { error: err.message };
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages = [
      ...messages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];

    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(ctx),
      tools,
      messages,
    });
  }

  return response.content.find(b => b.type === 'text')?.text ?? '';
}
```

---

## MCPContext

Every tool call receives a typed context object populated from the authenticated user session:

```javascript
// Populated in AI controller from req.user
const ctx = {
  userId: req.user.id,
  role: req.user.role,          // 'admin' | 'seller' | 'buyer'
  shopId: req.user.shopId,      // null for admin/buyer
  allowWrites: false,           // elevated to true only for write-tool endpoints
};
```

Role-scoping is enforced inside each tool handler — a seller tool always filters by `ctx.shopId`.

---

## System Prompt per Role

```javascript
function buildSystemPrompt(ctx) {
  const base = `You are Accio, the AI assistant for Embium marketplace. Today is ${new Date().toISOString().slice(0, 10)}.`;

  if (ctx.role === 'seller') return `${base}
You are helping a shop owner manage their store (shop ID: ${ctx.shopId}).
Use tools to fetch real data before answering questions about sales, inventory, or orders.
Never invent numbers. If data is unavailable, say so.`;

  if (ctx.role === 'admin') return `${base}
You are helping a platform administrator.
You have full read access to all shops, orders, and users.
For write actions, always confirm with the user before calling a write tool.`;

  if (ctx.role === 'buyer') return `${base}
You are helping a buyer discover products and track their orders.
Only access data belonging to this user.`;

  return base;
}
```

---

## Resources (Phase MCP-4)

MCP Resources are structured context blocks injected once per session — they give the AI ambient platform knowledge without a tool call.

**Shop Resource** (`backend/__modules__/mcp/resources/shop.resource.js`):

```javascript
async function buildShopResource(shopId) {
  const shop = await ShopService.getById(shopId);
  const plan = await SubscriptionService.getActivePlan(shopId);
  const alerts = await WarehouseService.getLowStockAlerts(shopId);

  return `## Your Shop: ${shop.name}
Status: ${shop.status} | Plan: ${plan?.name ?? 'None'}
Low-stock alerts: ${alerts.length > 0 ? alerts.map(a => a.product_name).join(', ') : 'None'}`;
}
```

Injected as the last paragraph of the system prompt on each session start.

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
MCP_WRITE_TOOLS_ENABLED=false   # flip to true when Phase MCP-3 is ready
```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `backend/__modules__/mcp/index.js` | **Create** — exports MCPRouter |
| `backend/__modules__/mcp/registry.js` | **Create** — tool registry Map |
| `backend/__modules__/mcp/router.js` | **Create** — MCPRouter class |
| `backend/__modules__/mcp/context.js` | **Create** — MCPContext builder |
| `backend/__modules__/mcp/tools/catalog.tools.js` | **Create** |
| `backend/__modules__/mcp/tools/orders.tools.js` | **Create** |
| `backend/__modules__/mcp/tools/analytics.tools.js` | **Create** |
| `backend/__modules__/mcp/tools/warehouse.tools.js` | **Create** |
| `backend/__modules__/mcp/tools/shop.tools.js` | **Create** |
| `backend/__modules__/mcp/tools/admin.tools.js` | **Create** |
| `backend/__modules__/mcp/tools/coins.tools.js` | **Create** *(after Phase L)* |
| `backend/__modules__/mcp/resources/shop.resource.js` | **Create** *(Phase MCP-4)* |
| `backend/__modules__/ai/services/ai.js` | **Modify** — replace Gemini with Anthropic SDK + MCP loop |
| `backend/__modules__/ai/controllers/ai.js` | **Modify** — build MCPContext from `req.user` |
| `backend/package.json` | **Modify** — add `@anthropic-ai/sdk`, `zod` |

---

## Permission Boundaries

MCP tools do NOT introduce new permission IDs — they reuse the existing service layer which already enforces permissions. The MCP layer adds a second check (role-based routing) before calling the service.

Write tools (Phase MCP-3) will reuse the relevant module permissions:
- Order status update → caller must have `ORDER_PUT`
- Stock adjustment → caller must have `WAREHOUSE_PUT`

---

## Verification Steps

1. `ANTHROPIC_API_KEY` set → `GET /seller/ai/ping` returns 200
2. Seller asks "What are my top products?" → AI calls `get_top_products` → returns real data from analytics service
3. Seller asks "Do I have low stock?" → AI calls `get_low_stock_alerts` → lists products below reorder point
4. Admin asks "How many shops are pending verification?" → AI calls `list_pending_shops` → correct count
5. Buyer from a different shop asks for seller data → MCPRouter returns 403, AI responds "I can't access that information"
6. Tool returns an error → AI handles gracefully, does not expose stack trace to user
7. Multi-turn: AI asks clarifying question, user replies, AI continues agentic loop with accumulated context
