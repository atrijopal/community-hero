const sharp = require('sharp');

const ALLOWED_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const processPhoto = async (buffer) => {
  // Basic check by buffer header
  if (!buffer || buffer.length < 4) {
    throw Object.assign(new Error('Invalid file'), { status: 400 });
  }

  const processed = await sharp(buffer)
    .withMetadata(false)  // strip ALL EXIF including GPS
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  return processed;
};

module.exports = { processPhoto };
