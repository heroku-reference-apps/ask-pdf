import type { ActionFunctionArgs, ErrorResponse } from 'react-router';
import type { PDFSimilarityData } from '~/types/pdf';

import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useFetcher } from 'react-router';
import {
  Button,
  Card,
  Container,
  Pill,
  Loader,
  Modal,
  Stack,
  ScrollArea,
  TextInput,
  rem,
} from '@mantine/core';
import {
  IconBraces,
  IconDatabaseSearch,
  IconBracketsContain,
} from '@tabler/icons-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import { CustomError } from '~/components/error';
import { getEmbeddings } from '~/server/ai.server';
import { similaritySearch } from '~/server/db.server';

interface SearchResults {
  success?: boolean;
  reason?: string;
  embeddings: number[];
  results: PDFSimilarityData[];
}

SyntaxHighlighter.registerLanguage('json', json);

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const search = formData.get('search') as string;
    const embeddings = await getEmbeddings(search);
    const results = await similaritySearch(embeddings);
    const response: SearchResults = {
      success: true,
      embeddings,
      results,
    };
    return response;
  } catch (_err: unknown) {
    return {
      success: false,
      reason: `The application can't connect to the database. Please check database configuration`,
    };
  }
}

export default function PGVectorDemo() {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [opened, { open, close }] = useDisclosure();
  const fetcher = useFetcher<SearchResults>();
  const isSubmitting = fetcher.state === 'submitting';
  const data = fetcher.data as SearchResults | undefined;

  if (data?.success === false) {
    const error: ErrorResponse = {
      status: 500,
      data: 'An error ocurred',
      statusText: data.reason || 'An unknown error ocurred. Please try again.',
    };
    return <CustomError error={error} />;
  }

  return (
    <Container fluid p="lg" w={rem(800)}>
      <Card withBorder shadow="md">
        <fetcher.Form method="post">
          <Stack>
            <TextInput
              label="Search term"
              name="search"
              disabled={isSubmitting}
              placeholder="Enter a search term..."
              leftSection={<IconDatabaseSearch />}
              rightSection={isSubmitting && <Loader size="xs" />}
            />
            <Button type="submit" variant="filled" disabled={isSubmitting}>
              Search
            </Button>
          </Stack>
        </fetcher.Form>
        {data?.results?.length && (
          <Stack mt={10}>
            <Modal title={title} opened={opened} onClose={close} size="xl">
              <ScrollArea h={400} type="always" offsetScrollbars>
                <SyntaxHighlighter language="json" style={vscDarkPlus}>
                  {content}
                </SyntaxHighlighter>
              </ScrollArea>
            </Modal>
            <Button
              variant="light"
              onClick={() => {
                setTitle('Search term embeddings');
                setContent(JSON.stringify(data?.embeddings, null, 2));
                open();
              }}
              leftSection={<IconBracketsContain />}
            >
              Show search term embeddings
            </Button>
            {data?.results?.map((result) => (
              <Card withBorder shadow="sm" key={result.id}>
                <Stack>
                  <Pill c="white" bg="myColor.3">
                    Distance: {result.distance}
                  </Pill>
                  {result.content}
                  <Button
                    variant="light"
                    leftSection={<IconBraces />}
                    onClick={() => {
                      setTitle('PDF Metadata');
                      setContent(JSON.stringify(result.metadata, null, 2));
                      open();
                    }}
                  >
                    Show pdf metadata
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Card>
    </Container>
  );
}
