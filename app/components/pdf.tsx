import type { FC } from 'react';
import type { PDFProps, PDFData } from '~/types/pdf';

import { useContext, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { StateContext } from '~/components/state';
import { PDFForm } from '~/components/pdf-form';
import { PDFViewer } from '~/components/pdf-viewer';
import { PDFSelect } from '~/components/pdf-select';
import { Card, Flex, Loader, Text } from '@mantine/core';

export const PDF: FC<PDFProps> = ({ documents, ..._props }) => {
  const fetcherSelect = useFetcher<PDFData>({ key: 'select-pdf' });
  const fetcherUpload = useFetcher<PDFData>({ key: 'upload-pdf' });

  const nameUpload = fetcherUpload.data?.name as string;
  const urlUpload = fetcherUpload.data?.url as string;
  const nameSelect = fetcherSelect.data?.name as string;
  const urlSelect = fetcherSelect.data?.url as string;

  const isUploading = fetcherUpload.state === 'submitting';

  // Set the filename in the state context

  const [filename, setFileName] = useContext(StateContext);

  useEffect(() => {
    if (nameUpload) {
      setFileName(nameUpload);
    } else if (nameSelect) {
      setFileName(nameSelect);
    }
  }, [nameUpload, nameSelect, setFileName]);

  return !filename ? (
    <Card withBorder shadow="md">
      <PDFSelect documents={documents} />
      <Text>or</Text>
      <PDFForm />
      {isUploading && (
        <Flex justify="center" align="center" gap="sm" pt="sm">
          <Loader size="sm" />
          <Text c="dimmed">Uploading and Vectorizing PDF...</Text>
        </Flex>
      )}
    </Card>
  ) : (
    <PDFViewer url={urlUpload || urlSelect} name={nameUpload || nameSelect} />
  );
};
