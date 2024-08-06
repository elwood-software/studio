import type {Dispatch} from 'react';
import type {SupabaseClient, User, Session} from '@supabase/supabase-js';

export type * as Supabase from '@supabase/supabase-js';

export type AppState = {
  client: SupabaseClient | null;
  isAuthenticated: boolean | null;
  user: User | null;
  session: Session | null;
};

export type AppContextAction = {
  type: 'SET_AUTHENTICATED';
  value: {
    user: User | null;
    session: Session | null;
  };
};

export type AppContextValue = [AppState, Dispatch<AppContextAction>];

export type PlanPrice = {
  id: string;
  price: number;
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
