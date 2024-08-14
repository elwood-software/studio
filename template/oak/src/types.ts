import type {Dispatch} from 'react';
import type {SupabaseClient, User, Session} from '@supabase/supabase-js';
import type {UseThemeProps} from 'next-themes/dist/types';

export type * as Supabase from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;
export type JsonObject = Record<string, Json>;

export type AppState = {
  client: SupabaseClient | null;
  isAuthenticated: boolean | null;
  user: User | null;
  session: Session | null;
  site: Site | null;
  theme: UseThemeProps | null;
};

export type AppContextAction =
  | {
      type: 'SET_AUTHENTICATED';
      value: {
        user: User | null;
        session: Session | null;
      };
    }
  | {
      type: 'SET_THEME';
      value: UseThemeProps;
    };

export type AppContextValue = [AppState, Dispatch<AppContextAction>];

export type PlanPrice = {
  id: string;
  price: {
    amount: number;
    decimal: string;
    currency: string;
  };
  per: 'month' | 'year' | 'one-time' | '3-months' | '6-months';
};

export type PlanInclude = {
  id: string;
  title: string;
  artwork_url: string;
  description: string;
  url: string;
};

export type Plan = {
  id: string;
  title: string;
  features: string;
  prices: PlanPrice[];
  includes: PlanInclude[];
};

export type CheckoutActionState = {
  success: boolean;
  redirect_url?: string;
  errors?: string[];
};

export type CheckoutActionData = {
  first_name?: string;
  last_name?: string;
  email?: string;
  plan_id: string;
  price_id: string;
};

export type Subscription = {
  id: string;
  plan_id: string;
};

export type Entitlement = {
  id: string;
  type: 'feed';
};

export type Site = {
  active: boolean;
  layoutType: 'show' | 'network';
  name: string;
  description: string;
  artwork: string;
  main_node_id: string;
  meta: {
    title: string;
    description: string;
  };
  shows: Array<{
    id: string;
    displayName: string;
    name: string;
    artwork: string;
  }>;
};

export type Episode = {
  id: string;
  title: string;
  description: string;
  artwork: string;
  audio_url: string;
  published_at: string;
  duration: number;
  show_id: string;
  number: string | null;
  category: 'PUBLIC' | 'PRIVATE';
  audio_playback_license_id: string | null;
  video_playback_license_id: string | null;
};

export type ApiGetPlaybackUrlInput = {
  client?: SupabaseClient | null;
  node_id: string;
  playback_license_id: string;
};

export type ApiGetPlaybackUrlResult = {
  url: string;
};
