const amqp = require('amqplib');
const { CONSTANTS } = require('../config/constants');
const db = require('../models');
const STATUSES = require('./statuses');
const SyncService = require('./sync/sync-service');
const RAW_QUEUE = 'raw_updates';
const PROCESSED_QUEUE = `processed_${CONSTANTS.HOSPITAL_CODE}_updates`;

const RABBIT_MQ_HOSTNAME = process.env.RABBIT_MQ_HOSTNAME || 'localhost';
const RABBIT_MQ_USERNAME = process.env.RABBIT_MQ_USERNAME || 'quest';
const RABBIT_MQ_PASSWORD = process.env.RABBIT_MQ_PASSWORD || 'guest';

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.retryDelay = 5000;
        this.connected = false;
    }

    // Connect to RabbitMQ
    async connect() {
        try {
            this.connection = await amqp.connect({
                hostname: RABBIT_MQ_HOSTNAME,
                username: RABBIT_MQ_USERNAME,
                password: RABBIT_MQ_PASSWORD
            });
            this.channel = await this.connection.createChannel();
            console.log('Connected to RabbitMQ');

            this.connection.on('error', (err) => {
                console.error('Connection error:', err)
                this.connected = false;
            })

            this.connection.on('close', () => {
                console.error('RabbitMQ connection closed, retrying...')
                setTimeout(() => this.connect(), this.retryDelay)
                this.connected = false;
            })
            this.connected = true;
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error)
            setTimeout(() => this.connect(), this.retryDelay)
            // throw error
        }
    }

    isConnected() {
        return (
            this.connected &&
            this.connection &&
            this.channel
        );
    }

    // Send a message to a specific queue
    async sendToQueue(message, queue = RAW_QUEUE) {
        try {
            await this.channel.assertQueue(queue, { durable: true })
            this.channel.sendToQueue(
                queue,
                Buffer.from(message),
                { persistent: true }
            )
            console.log(`Message sent to queue: ${queue}`)
        } catch (error) {
            console.error('Failed to send message to queue', error)
            throw error
        }
    }

    // Consume messages from a specific queue
    async consumeFromQueue(callback) {
        try {
            await this.channel.assertQueue(PROCESSED_QUEUE, { durable: true })
            console.log(`Waiting for messages in queue: ${PROCESSED_QUEUE}`)
            this.channel.consume(PROCESSED_QUEUE, async (msg) => {
                if (msg !== null) {
                    const content = await JSON.parse(msg?.content)
                    const headers = msg?.properties?.headers
                    await SyncService.syncMessageFromQueue(content, headers)
                    this.channel.ack(msg)
                }
            })
        } catch (error) {
            console.error('Failed to consume messages from queue', error)
        }
    }

    // Close the connection
    async closeConnection() {
        try {
            await this.channel.close()
            await this.connection.close()
            console.log('RabbitMQ connection closed')
        } catch (error) {
            console.error('Failed to close RabbitMQ connection', error)
        }
    }

    async syncUnsyncedActions(data) {
        if (data && data?.length) {
            Array.from(data).map(async (action) => {
                await this.sendToQueue(JSON.stringify(action), {
                    hospital: CONSTANTS.HOSPITAL_CODE,
                    model_type: action?.model
                }).then(async () => {
                    if (action && action instanceof db.LazyAction) {
                        action.status = STATUSES.STATUSE_COMPLETED
                        await action.save()
                    }
                })
            })
        }
    }
}

module.exports = RabbitMQService;