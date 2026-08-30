import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

async function uploadLogo() {
    try {
        const svgPath = path.resolve(__dirname, "../../web/public/logo.svg");
        const pngPath = path.resolve(__dirname, "../../web/public/logo.png");
        const mobileIcon = path.resolve(__dirname, "../../mobile/assets/images/icon.png");

        // Prefer svg, then web png, then mobile app icon
        let filePath: string | null = null;
        let contentType = 'application/octet-stream';

        if (fs.existsSync(svgPath)) {
            filePath = svgPath;
            contentType = 'image/svg+xml';
        } else if (fs.existsSync(pngPath)) {
            filePath = pngPath;
            contentType = 'image/png';
        } else if (fs.existsSync(mobileIcon)) {
            filePath = mobileIcon;
            contentType = 'image/png';
            console.log('Using mobile app icon as logo fallback:', mobileIcon);
        } else {
            console.error('No logo file found at web/public/logo.svg, web/public/logo.png, or mobile/assets/images/icon.png');
            return;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath).endsWith('.svg') ? 'logo.svg' : 'logo.png';

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: `public/${fileName}`,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await s3.send(command);
        console.log(`Logo successfully uploaded to R2 as public/${fileName}.`);
        console.log(`URL should be: ${process.env.AWS_URL}/public/${fileName}`);

        // Also try to upload mascot/icon for landing pages if mobile icon exists
        const mascotTarget = path.resolve(__dirname, '../../web/public/mascot.png');
        if (fs.existsSync(mobileIcon)) {
            const mascBuf = fs.readFileSync(mobileIcon);
            const mascCmd = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET,
                Key: `public/mascot.png`,
                Body: mascBuf,
                ContentType: 'image/png',
            });
            await s3.send(mascCmd);
            console.log('Mascot uploaded to R2 as public/mascot.png');
            console.log(`URL should be: ${process.env.AWS_URL}/public/mascot.png`);
        }
    } catch (e) {
        console.error("Failed to upload logo:", e);
    }
}

uploadLogo();
