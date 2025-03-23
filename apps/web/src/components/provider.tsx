"use client";

import { PropsWithChildren, useState } from "react";
import Link from "next/link";
import { Home, Settings, Tv } from "lucide-react";

import { RootProvider } from "@elwood/react";

import { createClient } from "#/lib/supabase/client";

export function Provider(props: PropsWithChildren) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_ELWOOD_API_BASE_URL!;
  const [supabaseClient] = useState(() => createClient());

  return (
    <RootProvider
      supabaseClient={supabaseClient}
      settings={{
        apiBaseUrl,
        Link,
        Logo: () => (
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Tv className="size-4" />
          </div>
        ),
        sideBarNav: [
          {
            title: "Home",
            url: "/",
            icon: Home,
          },

          {
            title: "Settings",
            url: "/settings",
            icon: Settings,
          },
        ],
      }}
    >
      {props.children}
    </RootProvider>
  );
}
