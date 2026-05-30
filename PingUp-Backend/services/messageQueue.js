/**
 * @fileoverview Message Queue Service
 * Uses BullMQ (backed by Redis) to process chat messages asynchronously.
 * 
 * Architecture Note:
 * When a user sends a message, the server immediately broadcasts it to the room
 * using Socket.io to keep the UI fast. However, saving the message to MongoDB
 * is offloaded to this BullMQ worker. If the database crashes or is slow, the 
 * message stays safe in Redis and will be retried automatically (up to 5 times)
 * using exponential backoff, preventing data loss and unblocking the main thread.
 */

const { Queue, Worker } = require('bullmq');
const Message = require('../models/Message');
const { ioRedisClient } = require('../config/redis');

const queueName = 'chat-messages';

// ─── Producer Setup ───────────────────────────────────────────────
const messageQueue = new Queue(queueName, {
    connection: ioRedisClient,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 1000 // 1s, 2s, 4s, 8s, 16s
        },
        removeOnFail: false // Keep failed jobs in Redis for manual inspection
    }
});

// ─── Consumer (Worker) Setup ──────────────────────────────────────
// This worker listens to the Redis queue and processes jobs (saving to MongoDB).
const messageWorker = new Worker(queueName, async (job) => {
    const { _id, roomName, userId, username, role, text, parentMessageId } = job.data;
    
    try {
        const msg = await Message.create({
            _id,
            roomName,
            userId,
            username,
            role,
            text,
            parentMessageId
        });

        if (parentMessageId) {
            await Message.findByIdAndUpdate(
                parentMessageId,
                { $inc: { replyCount: 1 } }
            );
        }
        
        return { success: true, messageId: msg._id };
    } catch (error) {
        console.error('Error saving message from queue:', error);
        throw error;
    }
}, {
    connection: ioRedisClient
});

messageWorker.on('completed', job => {
    // console.log(`Job with id ${job.id} has been completed`);
});

messageWorker.on('failed', (job, err) => {
    console.error(`Job with id ${job.id} has failed with error ${err.message}`);
});

module.exports = {
    messageQueue
};
