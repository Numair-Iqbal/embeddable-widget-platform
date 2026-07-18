// Primary geo provider: ip-api.com
async function lookupWithIpApi(ip) {
  const response = await fetch(`http://ip-api.com/json/${ip}`);
  if (!response.ok) {
    throw new Error('ip-api.com request failed');
  }
  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error('ip-api.com could not locate IP');
  }
  return {
    country: data.country || null,
    city: data.city || null,
    provider: 'ip-api.com'
  };
}

// Fallback geo provider: ipapi.co
async function lookupWithIpApiCo(ip) {
  const response = await fetch(`https://ipapi.co/${ip}/json/`);
  if (!response.ok) {
    throw new Error('ipapi.co request failed');
  }
  const data = await response.json();
  if (data.error) {
    throw new Error('ipapi.co could not locate IP');
  }
  return {
    country: data.country_name || null,
    city: data.city || null,
    provider: 'ipapi.co'
  };
}

// Fallback chain: try primary first, then fallback, then give up gracefully
async function getGeoInfo(ip) {
  // Local/private IPs can never be geolocated
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: null, city: null, provider: null };
  }

  try {
    return await lookupWithIpApi(ip);
  } catch (err1) {
    console.error('Primary geo lookup failed:', err1.message);
    try {
      return await lookupWithIpApiCo(ip);
    } catch (err2) {
      console.error('Fallback geo lookup also failed:', err2.message);
      return { country: null, city: null, provider: null };
    }
  }
}

module.exports = { getGeoInfo };