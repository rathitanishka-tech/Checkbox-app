export async function rateLimit(redis, userId) {
  const key = `rate:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 2); 
  }

  if (count > 4) { 
    return false;
  }

  return true;
}