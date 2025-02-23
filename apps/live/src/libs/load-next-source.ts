import type { StreamLoadNextSourceFn, StreamState } from "./stream.ts";
import { Database } from "../types.ts";

export type LoadNextSourceProviderInput = {
  db: Database;
  refId: string;
};

export function loadNextSourceProvider(
  input: LoadNextSourceProviderInput,
): StreamLoadNextSourceFn {
  return async function loadNextSource(state) {
    let data: Record<string, any> = {
      ...(state.data ?? {}),
    };

    const item = await input.db.selectFrom("playlist").selectAll()
      .where(
        "ref_id",
        "=",
        input.refId,
      )
      .where("has_played", "is", false)
      .$if(!!data.id, (q) => q.where("id", ">", Number(data.id)!))
      .limit(1)
      .executeTakeFirst();

    const item_: Record<string, any> = {
      ...item,
      data: JSON.parse(item?.data as unknown as string ?? "{}"),
    };

    // add our data
    if (item) {
      data = { ...data, ...item_.data, id: item.id };
    }

    return {
      ...state,
      nextSource: item_?.data.src ?? null,
      data,
    } as StreamState;
  };
}
