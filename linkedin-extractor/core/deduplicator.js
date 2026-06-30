import { generateSHA256, generateUUID } from '../utils/crypto.js';
import { storage } from './storage.js';
import { JobSchema } from './schema.js';

function extractNumber(str) {
    const match = String(str).replace(/,/g, '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

export async function deduplicate(posts, context) {
    const existingJobs = await storage.loadJobs();
    const existingByEmail = new Map();
    const existingByPhone = new Map();
    const existingByHash = new Map();

    existingJobs.forEach(job => {
        (job.emails || []).forEach(email => existingByEmail.set(email.toLowerCase(), job));
        (job.phones || []).forEach(phone => existingByPhone.set(phone, job));
        if (job.hash) existingByHash.set(job.hash, job);
    });

    const retentionHours = context.settings ? context.settings.retentionHours : 24;
    const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000).toISOString();
    const nowStr = new Date().toISOString();

    const updatedIds = new Set();
    const newJobs = [];

    for (const post of posts) {
        let existing = null;

        for (const email of (post.emails || [])) {
            if (existingByEmail.has(email.toLowerCase())) {
                existing = existingByEmail.get(email.toLowerCase());
                break;
            }
        }
        if (!existing) {
            for (const phone of (post.phones || [])) {
                if (existingByPhone.has(phone)) {
                    existing = existingByPhone.get(phone);
                    break;
                }
            }
        }

        if (!existing && post.company && post.company !== 'Unknown' && post.role && post.role !== 'Unknown') {
            const company = post.company.toLowerCase().trim();
            const role = post.role.toLowerCase().trim();
            existing = existingJobs.find(j =>
                j.company?.toLowerCase().trim() === company &&
                j.role?.toLowerCase().trim() === role
            );
        }

        if (!existing && post.text) {
            const hash = await generateSHA256(post.text);
            existing = existingByHash.get(hash);
        }

        if (existing) {
            updatedIds.add(existing.id);
            existing.lastSeenAt = nowStr;
            existing.expiresAt = expiresAt;

            if (post.company && post.company !== 'Unknown') existing.company = post.company;
            if (post.role && post.role !== 'Unknown') existing.role = post.role;
            if (post.post) existing.post = post.post;

            existing.emails = [...new Set([...(existing.emails || []), ...(post.emails || [])])];
            existing.phones = [...new Set([...(existing.phones || []), ...(post.phones || [])])];
            existing.links = [...new Set([...(existing.links || []), ...(post.links || [])])];

            if (post.payout && (!existing.payout || extractNumber(post.payout) > extractNumber(existing.payout))) {
                existing.payout = post.payout;
            }
            if (post.location && !existing.location) existing.location = post.location;
            if (post.experience && !existing.experience) existing.experience = post.experience;
            if (post.postingTime && !existing.postingTime) existing.postingTime = post.postingTime;
            if (post.postUrl && !existing.postUrl) existing.postUrl = post.postUrl;
            if (post.applyLink && !existing.applyLink) existing.applyLink = post.applyLink;
        } else {
            const hash = await generateSHA256(post.text || '');
            const newJob = {
                ...JobSchema,
                ...post,
                text: undefined,
                companyNodeText: undefined,
                id: generateUUID(),
                hash,
                createdAt: nowStr,
                lastSeenAt: nowStr,
                expiresAt
            };
            newJobs.push(newJob);
        }
    }

    for (const job of newJobs) {
        (job.emails || []).forEach(email => existingByEmail.set(email.toLowerCase(), job));
        (job.phones || []).forEach(phone => existingByPhone.set(phone, job));
    }

    const allJobs = existingJobs.map(job => {
        if (updatedIds.has(job.id)) return job;
        return job;
    });

    return [...allJobs, ...newJobs];
}
