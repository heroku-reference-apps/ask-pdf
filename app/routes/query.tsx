import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import { AI } from '~/src/ai';
import { PDFUtils } from '~/src/pdf';

export async function loader() {
  return redirect('/');
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'POST') {
    const formData = await request.formData();
    const filename = formData.get('filename') as string;

    if (!filename) {
      const errors = {
        filename: 'Please upload a PDF',
      };
      return json({ errors });
    }

    const question = formData.get('question') as string;
    const ai = await AI.build({
      filename: PDFUtils.getFileName(filename),
    });
    const response = await ai.query(question);
    return json({ response });
  }
}
