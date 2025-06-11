import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

import { AI } from '~/src/ai';

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
      return Response.json({ errors });
    }

    const question = formData.get('question') as string;
    const ai = await AI.build({
      filename,
    });
    const response = await ai.query(question);
    return Response.json({ response });
  }
}
