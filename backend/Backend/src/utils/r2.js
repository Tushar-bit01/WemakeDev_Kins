const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('./logger');

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
    }
});

const uploadToR2 = async (buffer, fileName) => {
    const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: `satellites/${fileName}`,
        Body: buffer,
        ContentType: 'image/jpeg',
    });

    await r2Client.send(command);
    logger.info(`Uploaded image to R2: satellites/${fileName}`);

    return `satellites/${fileName}`;
};

const deleteFromR2 = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
    });

    await r2Client.send(command);
    logger.info(`Deleted image from R2: ${key}`);
};

module.exports = { uploadToR2, deleteFromR2 };