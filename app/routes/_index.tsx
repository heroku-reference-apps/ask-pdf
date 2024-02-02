import type { MetaFunction, ErrorResponse } from '@remix-run/node';
import {
  useRouteError,
  isRouteErrorResponse,
  useLoaderData,
} from '@remix-run/react';

import { Grid } from '@mantine/core';
import { StateContextProvider } from '~/components/state';
import { PDF } from '~/components/pdf';
import { Chat } from '~/components/chat';
import { Error } from '~/components/error';

import { listPDFs } from '~/server/db.server';

export const meta: MetaFunction = () => {
  return [{ title: 'Ask PDF | Heroku at AWS re:Invent' }];
};

export async function loader() {
  try {
    const documents = await listPDFs();
    return {
      documents,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    throw new Response('An error ocurred', {
      status: 500,
      statusText: `The application can't connect to the database. Please check database configuration`,
    });
  }
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <Error error={error} />;
  }

  const errorResponse: ErrorResponse = {
    status: 500,
    statusText: 'An error ocurred',
    data: 'An unknown error ocurred. Please try again.',
  };

  return <Error error={errorResponse} />;
}

export default function App() {
  const { documents } = useLoaderData<typeof loader>();
  return (
    <StateContextProvider>
      <Grid.Col span={7}>
        <PDF documents={documents} />
      </Grid.Col>
      <Grid.Col span={5}>
        <Chat />
      </Grid.Col>
    </StateContextProvider>
  );
}
