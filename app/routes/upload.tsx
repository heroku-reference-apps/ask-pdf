import type { ActionFunctionArgs } from 'react-router';
import type { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import { PassThrough } from 'node:stream';

import { redirect } from 'react-router';
import { writeAsyncIterableToWritable } from '@react-router/node';
import { parseFormData, type FileUpload } from '@mjackson/form-data-parser';

import { PDFUtils } from '~/src/pdf';
import { AI } from '~/src/ai';
import { DB } from '~/src/db';

export async function loader() {
  return redirect('/');
}

async function uploadToS3(filename: string, fileUpload: FileUpload) {
  const passThrough = new PassThrough();

  // Convert ReadableStream to AsyncIterable
  const reader = fileUpload.stream().getReader();
  async function* streamToAsyncIterable() {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  await writeAsyncIterableToWritable(streamToAsyncIterable(), passThrough);

  // Upload the file to S3
  const response: CompleteMultipartUploadCommandOutput =
    await PDFUtils.uploadFile(filename, passThrough);

  // Vectorize the PDF
  const ai = await AI.build();
  await ai.vectorizePDF(filename);

  return response.Location;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'POST') {
    let name = '';
    let url = '';

    const uploadHandler = async (fileUpload: FileUpload) => {
      if (
        fileUpload.fieldName === 'pdf' &&
        fileUpload.type === 'application/pdf'
      ) {
        const uploadUrl = await uploadToS3(fileUpload.name, fileUpload);
        name = fileUpload.name;
        url = uploadUrl || '';
        return new File([await fileUpload.arrayBuffer()], fileUpload.name, {
          type: fileUpload.type,
        });
      }
    };

    await parseFormData(request, uploadHandler);

    if (name && url) {
      // Save the PDF in the database
      const db = new DB();
      await db.insertPDF(name, url);

      return Response.json({ name, url });
    }

    return Response.json(
      { error: 'No valid PDF file uploaded' },
      { status: 400 }
    );
  }
}
