import '@mantine/core/styles.css';

import type { LinksFunction } from 'react-router';
import type { MantineColorsTuple } from '@mantine/core';

import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import {
  MantineProvider,
  createTheme,
  Anchor,
  ColorSchemeScript,
  Container,
  Grid,
  Flex,
  Title,
} from '@mantine/core';
import { About } from '~/components/about';
import { Copyright } from '~/components/copyright';

const herokuPurple: MantineColorsTuple = [
  '#f4ebff',
  '#e3d1fb',
  '#c69ef9',
  '#a867f8',
  '#8e3bf7',
  '#7f21f7',
  '#7716f8',
  '#650cdd',
  '#5a07c5',
  '#430098',
];

const theme = createTheme({
  colors: {
    myColor: herokuPurple,
  },
  primaryColor: 'myColor',
});

export const links: LinksFunction = () => [];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <main>
          <MantineProvider theme={theme}>
            <Container fluid p="lg">
              <Flex mb="md" bg="myColor.9" align="center" c="white" p="xs">
                <Anchor href="/" c="white">
                  <Title order={1}>Ask</Title>
                </Anchor>
                <About />
                <Anchor
                  href="/vector"
                  size="xs"
                  fw={600}
                  c="white"
                  style={{
                    right: '2rem',
                    position: 'fixed',
                  }}
                >
                  pgvector Demo
                </Anchor>
              </Flex>
              <Grid>
                <Outlet />
              </Grid>
              <Copyright />
            </Container>
            <ScrollRestoration />
            <Scripts />
          </MantineProvider>
        </main>
      </body>
    </html>
  );
}
