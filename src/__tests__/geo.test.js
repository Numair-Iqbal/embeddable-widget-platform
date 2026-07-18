const { getGeoInfo } = require('../services/geo.service');

// The capstone brief itself says: "Mock the geo providers (one returns data,
// one you can toggle 'down') so the fallback test is deterministic." That's
// exactly what this file does — we replace global.fetch with a controllable
// mock instead of hitting the real ip-api.com / ipapi.co over the network.

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('Geo enrichment: provider fallback chain', () => {
  test('uses the primary provider (ip-api.com) when it succeeds', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('ip-api.com')) {
        return {
          ok: true,
          json: async () => ({ status: 'success', country: 'Pakistan', city: 'Lahore' })
        };
      }
      throw new Error('Fallback provider should NOT be called when primary succeeds');
    });

    const result = await getGeoInfo('103.10.20.30');

    expect(result.provider).toBe('ip-api.com');
    expect(result.country).toBe('Pakistan');
    expect(result.city).toBe('Lahore');
  });

  test('falls back to ipapi.co when the primary provider (ip-api.com) is down', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('ip-api.com')) {
        // Simulate provider 1 being down (network failure)
        throw new Error('ip-api.com is down');
      }
      if (url.includes('ipapi.co')) {
        return {
          ok: true,
          json: async () => ({ country_name: 'Pakistan', city: 'Karachi' })
        };
      }
    });

    const result = await getGeoInfo('103.10.20.30');

    expect(result.provider).toBe('ipapi.co');
    expect(result.country).toBe('Pakistan');
    expect(result.city).toBe('Karachi');
  });

  test('falls back to ipapi.co when ip-api.com responds but cannot locate the IP', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('ip-api.com')) {
        // Simulate a response that came back OK but with a "fail" status
        return { ok: true, json: async () => ({ status: 'fail' }) };
      }
      if (url.includes('ipapi.co')) {
        return { ok: true, json: async () => ({ country_name: 'Pakistan', city: 'Islamabad' }) };
      }
    });

    const result = await getGeoInfo('103.10.20.30');

    expect(result.provider).toBe('ipapi.co');
    expect(result.city).toBe('Islamabad');
  });

  test('degrades gracefully (nulls, no crash) when BOTH providers are down', async () => {
    global.fetch.mockImplementation(async () => {
      throw new Error('all providers down');
    });

    const result = await getGeoInfo('103.10.20.30');

    expect(result).toEqual({ country: null, city: null, provider: null });
  });

  test('never calls any provider for local/private IPs', async () => {
    global.fetch.mockImplementation(async () => {
      throw new Error('fetch should not be called for local IPs');
    });

    const result = await getGeoInfo('127.0.0.1');

    expect(result).toEqual({ country: null, city: null, provider: null });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});