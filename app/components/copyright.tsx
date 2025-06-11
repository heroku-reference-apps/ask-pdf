import { Anchor, Flex, Text } from '@mantine/core';

export const Copyright = () => {
  return (
    <Flex justify="center" align="center" direction="column" mt="xl">
      <Text c="dimmed" size="xs">
        &copy; 2025{' '}
        <Anchor href="https://heroku.com/home" target="_blank">
          Heroku
        </Anchor>
      </Text>
    </Flex>
  );
};
