import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = formData.get('pdf') as string;
  const [name, url] = data.split(';');
  return Response.json({ name, url });
}
