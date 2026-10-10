import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export function generateUploadSignature(folder: string = 'reelbeat') {
  if (!isCloudinaryConfigured) {
    return {
      configured: false,
      message: 'Cloudinary credentials not set in .env.local. Direct URL entry or local demo upload will be used.',
    };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    apiSecret as string
  );

  return {
    configured: true,
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  };
}

export { cloudinary };
