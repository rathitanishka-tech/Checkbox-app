import Redis from "ioredis";

const redisUrl = "redis://default:gQAAAAAAAb2CAAIgcDIxYWY2NmI3NzljMWM0YTFjYjg0ZTc1YThkYjRjMWE2Mg@on-skylark-114050.upstash.io:6379"; 

export const client = new Redis(redisUrl, { tls: {} });
export const pub = new Redis(redisUrl, { tls: {} });
export const sub = new Redis(redisUrl, { tls: {} });