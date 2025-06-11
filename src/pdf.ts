import type { Readable } from 'node:stream';
import url from 'node:url';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY as string,
  },
  region: process.env.BUCKETEER_AWS_REGION as string,
});

export class PDFUtils {
  static async uploadFile(filename: string, stream: Readable) {
    // Create a local copy of the file
    stream.pipe(createWriteStream(path.join(__dirname, '..', 'tmp', filename)));

    // Upload the file to S3
    return new Upload({
      client: s3,
      params: {
        Bucket: process.env.BUCKETEER_BUCKET_NAME as string,
        Key: `public/${filename}`,
        Body: stream,
        ContentType: 'application/pdf',
      },
    }).done();
  }

  static async loadPDF(filename: string) {
    const loader = new PDFLoader(path.join(__dirname, '..', 'tmp', filename));
    const docs = await loader.load();
    return docs;
  }

  static getFileName(filename: string) {
    return path.join(__dirname, '..', 'tmp', filename);
  }
}
