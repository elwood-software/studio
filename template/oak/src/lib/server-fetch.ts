import {ZodError} from 'zod';
import {headers} from 'next/headers';
import {createClient} from '@/utils/supabase/server';

export async function serverFetch(url: string, init: RequestInit) {
  const client = createClient();
  const h = headers();
  const origin = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
  const {data: session} = await client.auth.getSession();
  const initHeaders = (init.headers ?? {}) as Record<string, string>;

  const authHeader = session?.session?.access_token
    ? `Bearer ${session?.session?.access_token}`
    : undefined;

  const headers_ = {
    Authorization: authHeader as string,
    'x-origin': origin,
    'Content-Type': 'application/json',
    ...initHeaders,
  };

  console.log(init.body);

  const response = await fetch(`${baseUrl}${url}`, {
    ...init,
    headers: headers_,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const body = (await response.json()) as {
    success: boolean;
    error: any;
  };

  console.log(body, response.ok);

  if (!body.success && body.error?.issues) {
    throw ZodError.create(body.error.issues);
  }

  if (!body.success && body.error?.message) {
    throw new Error(body.error.message);
  }

  if (!response.ok) {
    throw new Error('Failed to fetch for unknown reason');
  }

  return body as any;
}
