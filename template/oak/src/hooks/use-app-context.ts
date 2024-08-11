import React, {
  createContext,
  useReducer,
  type Reducer,
  type PropsWithChildren,
  useEffect,
} from 'react';
import {useTheme} from 'next-themes';

import {createClient} from '@/utils/supabase/client';
import {
  AppContextValue,
  AppState,
  AppContextAction,
  Supabase,
  Site,
} from '@/types';

const defaultValue: AppState = {
  client: null,
  isAuthenticated: null,
  user: null,
  session: null,
  site: null,
  theme: null,
};

const AppContext = createContext<AppContextValue>([
  defaultValue,
  state => state,
]);

export type AppContextProviderProps = {
  session: Supabase.Session | null;
  site: Site | null;
};

export function AppContextProvider(
  props: PropsWithChildren<AppContextProviderProps>,
): JSX.Element {
  const theme = useTheme();
  const [state, dispatch] = useReducer<Reducer<AppState, AppContextAction>>(
    appContextReducer,
    {
      ...defaultValue,
      client: createClient(),
      isAuthenticated: !!props.session,
      site: props.site,
      user: props.session?.user || null,
      session: props.session,
      theme,
    },
  );

  useEffect(() => {
    dispatch({
      type: 'SET_THEME',
      value: theme,
    });
  }, [theme.theme]);

  useEffect(() => {
    let onAuthStateChangeSubscription: Supabase.Subscription | null = null;

    if (state.client) {
      onAuthStateChangeSubscription = state.client.auth.onAuthStateChange(
        (e, session) => {
          if (e === 'INITIAL_SESSION' && session) {
            dispatch({
              type: 'SET_AUTHENTICATED',
              value: {
                user: session.user,
                session: session,
              },
            });
          }

          if (!session) {
            dispatch({
              type: 'SET_AUTHENTICATED',
              value: {
                user: null,
                session: null,
              },
            });
          }
        },
      ).data.subscription;
    }

    return function unload() {
      onAuthStateChangeSubscription?.unsubscribe();
    };
  }, [state.client]);

  return React.createElement(
    AppContext.Provider,
    {value: [state, dispatch]},
    props.children,
  );
}

export function appContextReducer(
  state: AppState,
  action: AppContextAction,
): AppState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: !!action.value.user,
        user: action.value.user,
        session: action.value.session,
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.value,
      };
    default:
      return state;
  }
}

export function useAppContext(): AppContextValue {
  return React.useContext(AppContext);
}
