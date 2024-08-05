import {headers} from 'next/headers';

export async function serverFetch(url: string, init: RequestInit) {
  const h = headers();
  const origin = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
  const response = await fetch(`${baseUrl}${url}`, {
    ...init,
    headers: {
      ...init.headers,
      'x-origin': origin,
    },
  });

  return await response.json();
}
