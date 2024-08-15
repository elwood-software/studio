import type {
  Supabase,
  Plan,
  Subscription,
  Entitlement,
  Site,
  JsonObject,
  Episode,
  ApiGetPlaybackUrlInput,
  ApiGetPlaybackUrlResult,
  Json,
  Show,
} from '@/types';

export type FetcherRequestInit = Omit<RequestInit, 'body'> & {
  body?: JsonObject;
};

export type Fetcher = <R extends JsonObject = Json>(
  url: string,
  init: FetcherRequestInit,
) => Promise<R>;

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
        body: init.body ? JSON.stringify(init.body) : undefined,
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

  async episode(id: string): Promise<Episode | undefined> {
    const {episode} = await this.fetch_(`/episode/${id}`, {
      method: 'GET',
    });

    return episode ?? undefined;
  }

  async show(id: string): Promise<Show | undefined> {
    const {show} = await this.fetch_(`/show/${id}`, {
      method: 'GET',
    });

    return show ?? undefined;
  }

  async showEpisodes(id: string): Promise<Episode[]> {
    const {items} = await this.fetch_(`/show/${id}/episodes`, {
      method: 'GET',
    });

    return items ?? [];
  }

  async checkSubscription(plan_id: string): Promise<Subscription> {
    return await this.fetch_<Subscription>('/subscription/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {plan_id},
    });
  }

  async getPlaybackUrl(
    input: ApiGetPlaybackUrlInput,
  ): Promise<ApiGetPlaybackUrlResult> {
    const id = input.playback_license_id ?? input.node_id;
    const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
    const authHeader = (await input.client?.auth.getSession())?.data.session
      ?.access_token;
    const params: Record<string, string> = {};
    if (authHeader) {
      params.token = authHeader;
    }

    if (input.node_id) {
      if (input.playback_license_id) {
        params.license = input.playback_license_id;
      }
      return {
        url: `${baseUrl}/play/${input.node_id}?${new URLSearchParams(params).toString()}`,
      };
    }

    return {
      url: `${baseUrl}/play/${id}?${new URLSearchParams(params).toString()}`,
    };
  }
}
