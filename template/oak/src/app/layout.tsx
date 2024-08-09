import {PropsWithChildren} from 'react';

import {GeistSans} from 'geist/font/sans';
import './globals.css';
import {Provider, type ProviderProps} from './provider';
import {createClient} from '@/utils/supabase/server';
import {Api} from '@/data/api';
import {serverFetch} from '@/lib/server-fetch';

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

    if (!site) {
      return (
        <Shell>
          <div>Site Not Found</div>
        </Shell>
      );
    }

    if (site.active !== true) {
      return (
        <Shell>
          <div>coming soon</div>
        </Shell>
      );
    }

    console.log(site);

    return (
      <Shell>
        <Provider site={site} session={session.data.session ?? null}>
          {props.children}
        </Provider>
      </Shell>
    );
  } catch (_err) {
    return <Shell>500 Error</Shell>;
  }
}

function Shell(props: PropsWithChildren): JSX.Element {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-background text-foreground overscroll-none">
        {props.children}
      </body>
    </html>
  );
}
