import {PropsWithChildren} from 'react';

import {GeistSans} from 'geist/font/sans';
import './globals.css';
import {Provider} from './provider';
import {createClient} from '@/utils/supabase/server';

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
  const client = createClient();
  const session = await client.auth.getSession();

  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-background text-foreground overscroll-none">
        <Provider session={session.data?.session ?? null}>
          {props.children}
        </Provider>
      </body>
    </html>
  );
}
