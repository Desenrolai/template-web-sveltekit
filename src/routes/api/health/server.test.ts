import { describe, expect, it } from 'vitest';

import { GET } from './+server';

describe('GET /api/health', () => {
  it('responde 200 com status ok', async () => {
    // O handler não usa o RequestEvent; o cast mantém o teste focado no contrato
    // que o forge consome (`healthPath: /api/health`).
    const response = await GET({} as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
