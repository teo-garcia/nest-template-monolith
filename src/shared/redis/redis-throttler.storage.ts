import { Injectable } from '@nestjs/common'
import type { ThrottlerStorage } from '@nestjs/throttler'

import { RedisService } from './redis.service'

interface ThrottlerStorageRecord {
  totalHits: number
  timeToExpire: number
  isBlocked: boolean
  timeToBlockExpire: number
}

const RATE_LIMIT_SCRIPT = `
local function seconds(ms)
  if ms <= 0 then
    return 0
  end
  return math.ceil(ms / 1000)
end

local hitKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local blockDuration = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

local blockTtl = redis.call('PTTL', blockKey)
if blockTtl > 0 then
  local currentHits = tonumber(redis.call('GET', hitKey) or limit)
  return { currentHits, seconds(redis.call('PTTL', hitKey)), 1, seconds(blockTtl) }
end

local totalHits = redis.call('INCR', hitKey)
if totalHits == 1 then
  redis.call('PEXPIRE', hitKey, ttl)
end

local hitTtl = redis.call('PTTL', hitKey)
if totalHits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  return { totalHits, seconds(hitTtl), 1, seconds(blockDuration) }
end

return { totalHits, seconds(hitTtl), 0, 0 }
`

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string
  ): Promise<ThrottlerStorageRecord> {
    const redis = this.redisService.getClient()
    const hitKey = `throttle:${throttlerName}:${key}:hits`
    const blockKey = `throttle:${throttlerName}:${key}:blocked`

    const result = (await redis.eval(
      RATE_LIMIT_SCRIPT,
      2,
      hitKey,
      blockKey,
      ttl.toString(),
      blockDuration.toString(),
      limit.toString()
    )) as [number, number, number, number]

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = result

    return {
      totalHits: Number(totalHits),
      timeToExpire: Number(timeToExpire),
      isBlocked: Number(isBlocked) === 1,
      timeToBlockExpire: Number(timeToBlockExpire),
    }
  }
}
