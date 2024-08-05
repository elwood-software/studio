import {Plan} from '@/types';

export type Fetcher = (url: string, init: RequestInit) => Promise<any>;

export class Api {
  static server(serverFetch: Fetcher) {
    return new Api(serverFetch);
  }

  static client() {
    const baseUrl = process.env.NEXT_PUBLIC_STUDIO_API;
    return new Api(async (url: RequestInfo, init: RequestInit) => {
      const response = await fetch(`${baseUrl}${url}`, {
        ...init,
        headers: {
          ...init.headers,
          'x-origin': window.location.host,
        },
      });
      return await response.json();
    });
  }

  constructor(private readonly fetch_: Fetcher) {}

  async plans(): Promise<Plan[]> {
    const {plans} = await this.fetch_('/plan', {
      method: 'GET',
    });

    return plans;
  }

  async createCustomer(body: any) {
    return await this.fetch_('/plan', {
      method: 'GET',
      body: {
        ...body,
        mode: 'subscription',
      },
    });
  }
}
