const fetch = require('node-fetch');

const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res  = await fetch(url, {
      headers: { 'User-Agent': 'CommunityHero/1.0 (kensaraworks@gmail.com)' }
    });
    const data = await res.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
};

module.exports = { reverseGeocode };
