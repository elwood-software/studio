import {PropsWithChildren} from 'react';
import {ThemeProvider} from 'next-themes';
import {GeistSans} from 'geist/font/sans';

import './globals.css';

import {Provider} from './provider';
import {createClient} from '@/utils/supabase/server';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';
import {FatalError} from '@/components/pages/fatal-error';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Elwood Studio Podcast',
  description:
    'An amazing podcast about amazing things, distributed on elwood.studio.',
};

export default async function RootLayout(props: PropsWithChildren) {
  try {
    const client = createClient();
    const session = await client.auth.getSession();
    const site = await new Api(serverFetch).site();

    if (!site || site.active !== true) {
      throw new Error('Site not found');
    }

    return (
      <Shell>
        <Provider site={site} session={session.data.session ?? null}>
          {props.children}
        </Provider>
      </Shell>
    );
  } catch (_err) {
    console.error(_err);
    return (
      <Shell>
        <FatalError />
      </Shell>
    );
  }
}

function Shell(props: PropsWithChildren): JSX.Element {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground overscroll-none">
        <ThemeProvider attribute="class">{props.children}</ThemeProvider>
      </body>
    </html>
  );
}
