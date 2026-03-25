import { backendApi } from './backend-api';

interface AuditEventInput {
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  try {
    await backendApi.logAuditEvent(payload);
  } catch (error) {
    // Keep admin flows responsive even when audit endpoint is not yet deployed.
    console.warn('Audit log endpoint unavailable. Event kept in client logs.', payload, error);
  }
}
