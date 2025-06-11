import { useDisclosure, useToggle } from '@mantine/hooks';
import {
  useMantineTheme,
  Anchor,
  Image,
  Modal,
  Stack,
  Text,
  Divider,
} from '@mantine/core';
import { IconPdf, IconHeart } from '@tabler/icons-react';
import { Techstack } from '~/components/techstack';

export const About = () => {
  const [opened, { open, close }] = useDisclosure();
  const [value, toggle] = useToggle([
    'ask-pdf-diagram.png',
    'ask-pdf-diagram-steps.png',
  ]);
  const theme = useMantineTheme();

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Text size="xl" fw={600}>
            Ask <IconPdf />
          </Text>
        }
        size="xl"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack>
          <Divider />
          <Stack>
            <Text size="lg" fw={500}>
              About this demo
            </Text>
            <Text>
              This demo showcases the power of{' '}
              <Anchor href="https://www.heroku.com/ai">Heroku AI</Anchor>, which
              simplifies the development of intelligent applications. We use{' '}
              <Anchor href="https://www.heroku.com/ai/managed-inference-and-agents/">
                Heroku Managed Inference and Agents
              </Anchor>{' '}
              to seamlessly integrate large language models (LLMs) for natural
              language processing, and{' '}
              <Anchor href="https://www.heroku.com/ai/pgvector-for-heroku-postgres/">
                pgvector for Heroku Postgres
              </Anchor>{' '}
              for efficient similarity searches on vectorized data.
            </Text>
            <Text>
              The application follows a{' '}
              <strong>Retrieval-Augmented Generation (RAG)</strong> pattern.
              When a PDF is uploaded, its text is extracted, split into chunks,
              and converted into vector embeddings. These vectors are stored in
              a{' '}
              <Anchor href="https://www.heroku.com/postgres/">
                Heroku Postgres
              </Anchor>{' '}
              database with the pgvector extension. When you ask a question,
              it's also vectorized and used to find the most relevant text
              chunks from the document. This retrieved context is then combined
              with your question and sent to a Large Language Model, which
              generates a precise and contextually-aware answer.
            </Text>
          </Stack>
          <Divider />
          <Image
            src={value}
            onClick={() => toggle()}
            style={{
              cursor: 'pointer',
            }}
          />
          <Divider />
          <Techstack />
          <Divider />
          <Text size="sm">
            Built with <IconHeart color={theme.colors.myColor[9]} size={18} />{' '}
            by the Heroku Developer Relations Team
          </Text>
        </Stack>
      </Modal>
      <Anchor c="white" onClick={open}>
        <IconPdf size={42} />
      </Anchor>
    </>
  );
};
