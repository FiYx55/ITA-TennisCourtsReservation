import { agent } from './support/agent';

describe('Health', () => {
  it('GET /health returns ok', async () => {
    const res = await agent.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
