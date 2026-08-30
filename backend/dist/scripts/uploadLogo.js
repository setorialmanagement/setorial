"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
async function uploadLogo() {
    try {
        const svgPath = path.resolve(__dirname, "../../web/public/logo.svg");
        const pngPath = path.resolve(__dirname, "../../web/public/logo.png");
        const mobileIcon = path.resolve(__dirname, "../../mobile/assets/images/icon.png");
        let filePath = null;
        let contentType = 'application/octet-stream';
        if (fs.existsSync(svgPath)) {
            filePath = svgPath;
            contentType = 'image/svg+xml';
        }
        else if (fs.existsSync(pngPath)) {
            filePath = pngPath;
            contentType = 'image/png';
        }
        else if (fs.existsSync(mobileIcon)) {
            filePath = mobileIcon;
            contentType = 'image/png';
            console.log('Using mobile app icon as logo fallback:', mobileIcon);
        }
        else {
            console.error('No logo file found at web/public/logo.svg, web/public/logo.png, or mobile/assets/images/icon.png');
            return;
        }
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath).endsWith('.svg') ? 'logo.svg' : 'logo.png';
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: `public/${fileName}`,
            Body: fileBuffer,
            ContentType: contentType,
        });
        await s3.send(command);
        console.log(`Logo successfully uploaded to R2 as public/${fileName}.`);
        console.log(`URL should be: ${process.env.AWS_URL}/public/${fileName}`);
        const mascotTarget = path.resolve(__dirname, '../../web/public/mascot.png');
        if (fs.existsSync(mobileIcon)) {
            const mascBuf = fs.readFileSync(mobileIcon);
            const mascCmd = new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_BUCKET,
                Key: `public/mascot.png`,
                Body: mascBuf,
                ContentType: 'image/png',
            });
            await s3.send(mascCmd);
            console.log('Mascot uploaded to R2 as public/mascot.png');
            console.log(`URL should be: ${process.env.AWS_URL}/public/mascot.png`);
        }
    }
    catch (e) {
        console.error("Failed to upload logo:", e);
    }
}
uploadLogo();
//# sourceMappingURL=uploadLogo.js.map