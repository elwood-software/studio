import {ZodError} from 'zod';
import {headers} from 'next/headers';
import {createClient} from '@/utils/supabase/server';

import type {JsonObject} from '@/types';
import type {FetcherRequestInit} from '@/data/api';

export async function serverFetch<R extends JsonObject = JsonObject>(
  url: string,
  init: FetcherRequestInit,
): Promise<R> {
  const client = createClient();
  const h = headers();
  const origin = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
  const {data: session} = await client.auth.getSession();
  const headers_ = new Headers(init.headers ?? {});
  const authHeader = session?.session?.access_token
    ? `Bearer ${session?.session?.access_token}`
    : undefined;

  headers_.set('x-origin', origin);
  headers_.set('Content-Type', 'application/json');

  if (authHeader) {
    headers_.set('Authorization', authHeader);
  }

  const response = await fetch(`${baseUrl}${url}`, {
    ...init,
    headers: headers_,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const body = (await response.json()) as {
    success: boolean;
    error: JsonObject;
  };

  if (!body.success && body.error?.issues) {
    throw ZodError.create(body.error.issues);
  }

  if (!body.success && body.error?.message) {
    throw new Error(
      `Failed to fetch ("${url}") with error "${body.error?.message}"`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ("${url}") for unknown reason. Code ${response.status}`,
    );
  }

  return body as JsonObject as R;
}
