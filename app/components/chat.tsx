import type { FC, ReactNode } from 'react';
import type { ChatData } from '~/types/chat';
import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useFetcher } from 'react-router';
import ReactMarkdown from 'react-markdown';
import {
  useMantineTheme,
  Box,
  Button,
  Card,
  Flex,
  Group,
  Text,
  TextInput,
  Loader,
  Space,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconExclamationCircle,
  IconMessage2Check,
  IconMessage2Question,
} from '@tabler/icons-react';
import { StateContext } from '~/components/state';

const ChatMessage = ({
  icon,
  message,
}: {
  icon?: JSX.Element;
  message: ReactNode;
}) => {
  return (
    <Card withBorder shadow="md" radius="md" mt="sm">
      <Card.Section inheritPadding p="md">
        <Flex align="flex-start">
          <Box mr="sm">{icon}</Box>
          <Box>{message}</Box>
        </Flex>
      </Card.Section>
    </Card>
  );
};

const ChatResponse: FC<{ answer: string }> = ({
  answer,
}: {
  answer: string;
}) => {
  const theme = useMantineTheme();
  const icon = <IconMessage2Check color={theme.colors.green[7]} />;
  return (
    <ChatMessage
      icon={icon}
      message={<ReactMarkdown>{answer}</ReactMarkdown>}
    />
  );
};

export const Chat = () => {
  const theme = useMantineTheme();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<ChatData>({ key: 'query' });
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [filename] = useContext(StateContext);

  const isSubmitting = fetcher.state === 'submitting';
  const response = fetcher.data?.response;
  const errors = fetcher.data?.errors;

  const handleResponseChange = useCallback(() => {
    if (response?.answer) {
      setAnswer(response.answer);
    } else if (isSubmitting) {
      setAnswer('');
    } else {
      formRef.current?.reset();
    }
  }, [response, isSubmitting]);

  useEffect(() => {
    handleResponseChange();
  }, [handleResponseChange]);

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.location.reload();
  };

  const iconQuestion = <IconMessage2Question color={theme.colors.myColor[9]} />;
  const iconError = <IconExclamationCircle color={theme.colors.red[7]} />;

  // Prevent double submission
  formRef.current?.addEventListener('submit', (e) => {
    e.preventDefault();
  });

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fetcher.submit(formRef.current, {
      method: 'POST',
    });
    setQuestion(inputRef.current?.value || '');
  };

  return (
    <Card withBorder shadow="sm">
      {filename ? (
        <>
          <fetcher.Form method="post" action="/query" ref={formRef}>
            <input
              type="hidden"
              name="filename"
              value={filename}
              required={true}
            />
            <TextInput
              leftSection={iconQuestion}
              rightSection={isSubmitting && <Loader size="xs" />}
              disabled={isSubmitting}
              type="text"
              name="question"
              label="Ask a question"
              placeholder="Type your question here..."
              ref={inputRef}
              onKeyDown={(e) => {
                const keyCode = e.which || e.keyCode;
                if (keyCode === 13) {
                  fetcher.submit(e.currentTarget.form, {
                    method: 'POST',
                  });
                  setQuestion(e.currentTarget.value);
                }
              }}
            />
          </fetcher.Form>
          <Space h="md" />
          <Button
            variant="filled"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            Submit
          </Button>
          {question && (
            <ChatMessage
              icon={iconQuestion}
              message={<Text>{question}</Text>}
            />
          )}
          {answer && <ChatResponse answer={answer} />}
          {errors && (
            <ChatMessage
              icon={iconError}
              message={<Text>{errors.filename}</Text>}
            />
          )}
          <Space h="md" />
          <Button variant="filled" color="red" onClick={handleReset}>
            Restart
          </Button>
        </>
      ) : (
        <Group>
          <IconInfoCircle color={theme.colors.blue[7]} />
          <Text>Please select or upload a PDF to ask questions</Text>
        </Group>
      )}
    </Card>
  );
};
