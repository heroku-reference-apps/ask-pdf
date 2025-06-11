import { useRef } from 'react';
import { useMantineTheme, Loader, FileInput } from '@mantine/core';
import { useFetcher } from 'react-router';
import { IconFileTypePdf } from '@tabler/icons-react';

export const PDFForm = () => {
  const theme = useMantineTheme();
  const formRef = useRef<HTMLFormElement>(null);
  const fetcher = useFetcher({ key: 'upload-pdf' });
  const isSubmitting = fetcher.state === 'submitting';

  const uploadFile = () => {
    fetcher.submit(formRef.current, {
      method: 'POST',
    });
  };

  const icon = <IconFileTypePdf color={theme.colors.red[7]} />;

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      action="/upload"
      encType="multipart/form-data"
    >
      <FileInput
        type="submit"
        name="pdf"
        placeholder="Upload a PDF document"
        accept="application/pdf"
        disabled={isSubmitting}
        onChange={uploadFile}
        leftSection={icon}
        rightSection={isSubmitting && <Loader size="xs" />}
      />
    </fetcher.Form>
  );
};
