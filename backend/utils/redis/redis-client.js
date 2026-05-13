const { createClient } = require('redis');

const REDIS_URI = process.env.REDIS_URI || null;
const OFFICE_PREFIX = process.env.REDIS_OFFICE_PREFIX || 'of';
const OFFICE_ID = process.env.REDIS_OFFICE_ID || 0;

class RedisClient {
    constructor(redisClient) {
        this.client = redisClient;
    }

    forOffice(officeId) {
        if (!officeId) throw new Error('OFFICE_ID is required');
        return new ScopedRedisClient(this.client, officeId);
    }
}

class ScopedRedisClient {
    constructor(client, officeId) {
        this.client = client;
        this.officeId = officeId;
        this.prefix = `${OFFICE_PREFIX}:${officeId}:`;
    }

    _key(key) {
        return `${this.prefix}${key}`;
    }

    // String operations
    async set(key, value, options = {}) {
        const serialized = JSON.stringify(value);
        if (options.ttl) {
            return this.client.setEx(this._key(key), options.ttl, serialized);
        }
        return this.client.set(this._key(key), serialized);
    }

    async get(key) {
        const value = await this.client.get(this._key(key));
        return value ? JSON.parse(value) : null;
    }

    async delete(key) {
        return this.client.del(this._key(key));
    }

    async exists(key) {
        return this.client.exists(this._key(key));
    }

    // Hash operations
    async hSet(key, field, value) {
        return this.client.hSet(this._key(key), field, JSON.stringify(value));
    }

    async hGet(key, field) {
        const value = await this.client.hGet(this._key(key), field);
        return value ? JSON.parse(value) : null;
    }

    async hGetAll(key) {
        const hash = await this.client.hGetAll(this._key(key));
        const result = {};
        for (const [field, value] of Object.entries(hash)) {
            result[field] = JSON.parse(value);
        }
        return result;
    }

    async hDel(key, field) {
        return this.client.hDel(this._key(key), field);
    }

    // List operations
    async lPush(key, ...values) {
        const serialized = values.map(v => JSON.stringify(v));
        return this.client.lPush(this._key(key), serialized);
    }

    async rPush(key, ...values) {
        const serialized = values.map(v => JSON.stringify(v));
        return this.client.rPush(this._key(key), serialized);
    }

    async lRange(key, start, stop) {
        const values = await this.client.lRange(this._key(key), start, stop);
        return values.map(v => JSON.parse(v));
    }

    async lPop(key) {
        const value = await this.client.lPop(this._key(key));
        return value ? JSON.parse(value) : null;
    }

    async rPop(key) {
        const value = await this.client.rPop(this._key(key));
        return value ? JSON.parse(value) : null;
    }

    // Set operations
    async sAdd(key, ...members) {
        const serialized = members.map(m => JSON.stringify(m));
        return this.client.sAdd(this._key(key), serialized);
    }

    async sMembers(key) {
        const members = await this.client.sMembers(this._key(key));
        return members.map(m => JSON.parse(m));
    }

    async sRem(key, ...members) {
        const serialized = members.map(m => JSON.stringify(m));
        return this.client.sRem(this._key(key), serialized);
    }

    // Expiry
    async expire(key, seconds) {
        return this.client.expire(this._key(key), seconds);
    }

    async ttl(key) {
        return this.client.ttl(this._key(key));
    }

    // Pattern matching (scoped to office)
    async keys(pattern = '*') {
        const keys = await this.client.keys(this._key(pattern));
        return keys.map(k => k.replace(this.prefix, ''));
    }

    // Delete all keys for this office
    async flushOffice() {
        const keys = await this.client.keys(this._key('*'));
        if (keys.length > 0) {
            return this.client.del(keys);
        }
        return 0;
    }
}

async function createRedisClient() {
    const url = REDIS_URI || 'redis://localhost:6379';
    const client = createClient({ url });

    client.on('error', err => console.error('Redis Client Error', err));
    client.on('connect', () => console.log('Redis Client Connected'));

    await client.connect();

    return new RedisClient(client);
}

function redisMiddleware(redisClient) {
    return (req, res, next) => {
        if (redisClient && OFFICE_ID) {
            req.redis = redisClient.forOffice(OFFICE_ID);
        }
        next();
    };
}

async function bindRedisClient(app) {
    const redisClient = await createRedisClient();
    app.redis = redisClient.forOffice(OFFICE_ID);
}

async function getOrSet(req, key, callback, options = {}) {
    // If Redis not available, just return fresh data without caching
    const redisClient = req?.app?.redis;
    if (!redisClient) {
        return await callback();
    }

    // Try to get from cache
    const cached = await redisClient.get(key);

    if (cached !== null) {
        return cached;
    }

    // Not in cache, call the callback to get fresh data
    const freshData = await callback();

    // Store in cache
    await redisClient.set(key, freshData, options);

    return freshData;
}

async function trySet(req, key, valueOrCallback, options = {}) {
    const redisClient = req?.app?.redis;
    if (!redisClient) {
        return false;
    }
    try {
        // If callback provided, execute it to get the value
        const value = typeof valueOrCallback === 'function'
            ? await valueOrCallback()
            : valueOrCallback;
        await redisClient.set(key, value, options);
        return true;
    } catch (error) {
        console.error(`Failed to save key "${key}" to Redis:`, error);
        return false;
    }
}

module.exports = { redisMiddleware, createRedisClient, bindRedisClient, getOrSet, trySet };