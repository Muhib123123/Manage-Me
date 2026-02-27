import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 is S3-compatible — we use the AWS SDK
export const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

/**
 * Generate a pre-signed URL so the client can upload directly to R2
 * without the file passing through our Next.js server.
 */
export async function generateUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return { uploadUrl, fileUrl };
}

/**
 * Generate a pre-signed URL to read/stream a file from R2
 * (used by the YouTube upload worker to stream the video).
 */
export async function generateDownloadUrl(key: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
    });

    return getSignedUrl(r2, command, { expiresIn: 7200 }); // 2 hours
}

/**
 * Extract the R2 object key from a full file URL.
 * e.g. "https://pub.r2.dev/videos/abc.mp4" → "videos/abc.mp4"
 */
export function getKeyFromUrl(fileUrl: string): string {
    const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
    return fileUrl.replace(`${base}/`, "");
}
