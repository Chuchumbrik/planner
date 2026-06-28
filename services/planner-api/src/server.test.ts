import { describe, expect, it, vi } from 'vitest';

const listen = vi.fn((_port: number, _host: string, cb: () => void) => {
  cb();
});

vi.mock('./app.js', () => ({
  createApp: () => ({ listen }),
}));

describe('startServer', () => {
  it('listens on PORT or 8080', async () => {
    listen.mockClear();
    const { startServer } = await import('./server.js');
    delete process.env.PORT;
    startServer();
    expect(listen).toHaveBeenCalledWith(8080, '0.0.0.0', expect.any(Function));
  });
});
