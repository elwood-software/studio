import type {
  Supabase,
  Plan,
  Subscription,
  Entitlement,
  Site,
  JsonObject,
  Episode,
} from '@/types';

export type FetcherRequestInit = Omit<RequestInit, 'body'> & {
  body?: JsonObject;
};

export type Fetcher = (
  url: string,
  init: FetcherRequestInit,
) => Promise<JsonObject>;

export type SubscriptionsFilter = {
  plan_id?: string;
};

export type EntitlementsFilter = {
  subscription_id?: string;
};

export type EpisodesFilter = {
  show_id?: string;
  category?: 'PUBLIC' | 'PRIVATE';
};

export class Api {
  static server(serverFetch: Fetcher) {
    return new Api(serverFetch);
  }

  static client(
    client: Supabase.SupabaseClient | undefined | null = undefined,
  ) {
    const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
    return new Api(async (url: RequestInfo, init: FetcherRequestInit) => {
      const headers_ = new Headers({
        ...init.headers,
        'x-origin': window.location.host,
      });

      if (client) {
        const authHeader = (await client?.auth.getSession())?.data.session
          ?.access_token;

        if (authHeader) {
          headers_.set('Authorization', `Bearer ${authHeader}`);
        }
      }

      const response = await fetch(`${baseUrl}${url}`, {
        ...init,
        headers: headers_,
      } as RequestInit);
      return await response.json();
    });
  }

  constructor(private readonly fetch_: Fetcher) {}

  async site(): Promise<Site> {
    const {site} = await this.fetch_('/site', {
      method: 'GET',
      next: {revalidate: 1000 * 4},
    });

    return site;
  }

  async plans(): Promise<Plan[]> {
    const {plans} = await this.fetch_('/plan', {
      method: 'GET',
    });

    return plans;
  }

  async createCustomer(body: JsonObject, headers: Record<string, string> = {}) {
    return await this.fetch_('/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: {
        ...body,
        mode: 'subscription',
      },
    });
  }

  async subscriptions(
    filter: SubscriptionsFilter = {},
  ): Promise<Subscription[]> {
    const {subscriptions} = await this.fetch_(
      `/subscription?${new URLSearchParams(filter).toString()}`,
      {
        method: 'GET',
      },
    );

    return subscriptions ?? [];
  }

  async entitlements(filter: EntitlementsFilter = {}): Promise<Entitlement[]> {
    const {entitlements} = await this.fetch_(
      `/subscription/${filter.subscription_id}/entitlements`,
      {
        method: 'GET',
      },
    );

    return entitlements ?? [];
  }

  async episodes(filter: EpisodesFilter): Promise<Episode[]> {
    const {episodes} = await this.fetch_(
      `/episode?${new URLSearchParams(filter).toString()}`,
      {
        method: 'GET',
      },
    );

    return episodes ?? [];
  }
}
