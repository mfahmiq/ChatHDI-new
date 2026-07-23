const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export class NvidiaRequestQueue {
  constructor({
    limit = 40,
    intervalMs = 60_000,
    concurrency = 4,
    maxQueueSize = 200,
  } = {}) {
    this.limit = toPositiveInteger(limit, 40);
    this.intervalMs = toPositiveInteger(intervalMs, 60_000);
    this.concurrency = toPositiveInteger(concurrency, 4);
    this.maxQueueSize = toPositiveInteger(maxQueueSize, 200);
    this.queue = [];
    this.startedAt = [];
    this.active = 0;
    this.timer = null;
  }

  enqueue(task, metadata = {}) {
    if (typeof task !== 'function') {
      return Promise.reject(new TypeError('NVIDIA queue membutuhkan task berupa fungsi.'));
    }

    if (this.queue.length >= this.maxQueueSize) {
      const error = new Error(
        `Antrean NVIDIA penuh (${this.maxQueueSize} request). Silakan coba lagi beberapa saat.`
      );
      error.code = 'NVIDIA_QUEUE_FULL';
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      const queuePosition = this.queue.length + 1;
      this.queue.push({
        task,
        resolve,
        reject,
        metadata,
        enqueuedAt: Date.now(),
      });

      console.log(
        `[NVIDIA Queue] Queued ${metadata.type || 'request'} for ${metadata.model || 'unknown'} ` +
        `(position=${queuePosition}, active=${this.active})`
      );
      this.schedule(0);
    });
  }

  getStatus() {
    const now = Date.now();
    this.prune(now);
    const available = Math.max(0, this.limit - this.startedAt.length);
    const nextSlotAt = available > 0
      ? now
      : (this.startedAt[0] || now) + this.intervalMs;

    return {
      limit: this.limit,
      intervalMs: this.intervalMs,
      concurrency: this.concurrency,
      queued: this.queue.length,
      active: this.active,
      available,
      estimatedWaitMs: Math.max(0, nextSlotAt - now),
    };
  }

  prune(now = Date.now()) {
    const cutoff = now - this.intervalMs;
    while (this.startedAt.length > 0 && this.startedAt[0] <= cutoff) {
      this.startedAt.shift();
    }
  }

  schedule(delayMs) {
    if (this.timer) {
      if (delayMs !== 0) return;
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      this.drain();
    }, Math.max(0, delayMs));
  }

  drain() {
    const now = Date.now();
    this.prune(now);

    while (
      this.queue.length > 0 &&
      this.active < this.concurrency &&
      this.startedAt.length < this.limit
    ) {
      const entry = this.queue.shift();
      this.startedAt.push(Date.now());
      this.active += 1;
      const waitMs = Date.now() - entry.enqueuedAt;

      console.log(
        `[NVIDIA Queue] Starting ${entry.metadata.type || 'request'} for ` +
        `${entry.metadata.model || 'unknown'} (wait=${waitMs}ms, active=${this.active})`
      );

      Promise.resolve()
        .then(entry.task)
        .then(entry.resolve, entry.reject)
        .finally(() => {
          this.active -= 1;
          this.schedule(0);
        });
    }

    if (this.queue.length === 0 || this.active >= this.concurrency) return;

    this.prune();
    if (this.startedAt.length >= this.limit) {
      const nextSlotAt = this.startedAt[0] + this.intervalMs;
      this.schedule(Math.max(25, nextSlotAt - Date.now() + 25));
    }
  }
}

const globalQueueKey = '__CHAT_HDI_NVIDIA_REQUEST_QUEUE__';

if (!globalThis[globalQueueKey]) {
  globalThis[globalQueueKey] = new NvidiaRequestQueue({
    limit: process.env.NVIDIA_REQUESTS_PER_MINUTE || 40,
    intervalMs: 60_000,
    concurrency: process.env.NVIDIA_MAX_CONCURRENT_REQUESTS || 4,
    maxQueueSize: process.env.NVIDIA_MAX_QUEUE_SIZE || 200,
  });
}

export const nvidiaRequestQueue = globalThis[globalQueueKey];
