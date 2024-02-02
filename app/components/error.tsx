import { Container, Title, Text } from '@mantine/core';
import type { ErrorResponse } from '@remix-run/node';

export function Error({ error }: { error: ErrorResponse }) {
  return (
    <Container mt="xl">
      <Title ta="center">{error.data}</Title>
      <Text size="lg" mt="lg" ta="center" c="red">
        {error.statusText}
      </Text>
    </Container>
  );
}
