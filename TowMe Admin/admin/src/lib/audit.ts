import { backendApi } from './backend-api';

interface AuditEventInput {
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

const AUDIT_QUEUE_KEY = 'towme-admin-audit-queue';

function readAuditQueue(): AuditEventInput[] {
  try {
    const raw = localStorage.getItem(AUDIT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAuditQueue(queue: AuditEventInput[]) {
  localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify(queue.slice(0, 200)));
}

export function getPendingAuditEventCount(): number {
  return readAuditQueue().length;
}

export async function flushAuditQueue(): Promise<void> {
  const queue = readAuditQueue();
  if (queue.length === 0) return;

  const failed: AuditEventInput[] = [];
  for (const event of queue) {
    const payload = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    try {
      await backendApi.logAuditEvent(payload);
    } catch {
      failed.push(event);
    }
  }

  writeAuditQueue(failed);
}

export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  try {
    await flushAuditQueue();
    await backendApi.logAuditEvent(payload);
  } catch (error) {
    const queue = readAuditQueue();
    queue.push(event);
    writeAuditQueue(queue);
    console.warn('Audit log endpoint unavailable. Event queued for retry.', payload, error);
  }
}
