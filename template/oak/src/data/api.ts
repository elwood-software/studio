import type {Supabase, Plan, Subscription, Entitlement, Site} from '@/types';

export type Fetcher = (url: string, init: RequestInit) => Promise<any>;

export type SubscriptionsFilter = {
  plan_id?: string;
};

export type EntitlementsFilter = {
  subscription_id?: string;
};

export class Api {
  static server(serverFetch: Fetcher) {
    return new Api(serverFetch);
  }

  static client(
    client: Supabase.SupabaseClient | undefined | null = undefined,
  ) {
    const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
    return new Api(async (url: RequestInfo, init: RequestInit) => {
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
      });
      return await response.json();
    });
  }

  constructor(private readonly fetch_: Fetcher) {}

  async site(): Promise<Site> {
    const {site} = await this.fetch_('/site', {
      method: 'GET',
    });

    return site;
  }

  async plans(): Promise<Plan[]> {
    const {plans} = await this.fetch_('/plan', {
      method: 'GET',
    });

    return plans;
  }

  async createCustomer(body: any, headers: Record<string, string> = {}) {
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
}
