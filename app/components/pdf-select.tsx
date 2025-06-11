import type { FC } from 'react';
import type { PDFSelectProps } from '~/types/pdf';

import { useFetcher } from 'react-router';
import { useMantineTheme, NativeSelect, Loader } from '@mantine/core';
import { IconFileTypePdf } from '@tabler/icons-react';
export const PDFSelect: FC<PDFSelectProps> = ({ documents, ..._props }) => {
  const theme = useMantineTheme();
  const fetcher = useFetcher({ key: 'select-pdf' });
  const fetcherUpload = useFetcher({ key: 'upload-pdf' });

  const isSubmitting =
    fetcher.state === 'submitting' || fetcherUpload.state === 'submitting';

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.currentTarget.value) return;

    fetcher.submit(e.currentTarget.form, {
      method: 'POST',
    });
  };

  const pdfs = documents.map((doc) => ({
    label: doc.name,
    value: `${doc.name};${doc.url}`,
  }));

  const options = [
    { label: 'Select an existing PDF document', value: '' },
    ...pdfs,
  ];

  const icon = <IconFileTypePdf color={theme.colors.red[7]} />;

  return (
    <fetcher.Form method="post" action="/select">
      <NativeSelect
        data={options}
        disabled={isSubmitting}
        label="PDF document"
        name="pdf"
        leftSection={icon}
        rightSection={isSubmitting && <Loader size="xs" />}
        onChange={handleSelect}
      />
    </fetcher.Form>
  );
};
