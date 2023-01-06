import type { RPSpec, VersionSpec, Authorization } from "./types";
import type { ValidJSON } from "@withcardinal/ts-std";
import { RPError } from "./rperror.js";

type Client<V extends VersionSpec> = {
  query<K extends keyof V["queries"]>(
    proc: K,
    payload?: Parameters<V["queries"][K]>[1]
  ): ReturnType<V["queries"][K]>;

  mutate<K extends keyof V["mutations"]>(
    proc: K,
    payload?: Parameters<V["mutations"][K]>[1]
  ): ReturnType<V["mutations"][K]>;
};

export function client<T extends RPSpec, V extends keyof RPSpec["versions"]>(
  url: string,
  version: V,
  auth?: Authorization | undefined,
  fetcher: typeof fetch = fetch
): Client<T["versions"][V]> {
  return {
    query: request(new URL(url), version, false, fetcher, auth) as unknown,
    mutate: request(new URL(url), version, true, fetcher, auth) as unknown,
  } as Client<T["versions"][V]>;
}

function request(
  url: URL,
  version: string,
  mutation: boolean,
  fetcher: typeof fetch,
  auth?: Authorization | undefined
): (proc: string, payload: unknown) => Promise<ValidJSON> {
  return async (proc: string, payload: unknown) => {
    const init: RequestInit = {};
    const headers: Record<string, string> = { "rpc-api-version": version };

    if (auth && auth.scheme !== "") {
      headers["authorization"] = `${auth.scheme} ${auth.token}`;
    }

    if (!mutation) {
      url.searchParams.set("p", proc);
      if (payload) {
        url.searchParams.set("a", JSON.stringify(payload));
      }
    } else {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify({ p: proc, a: payload });
      init.method = "POST";
    }

    init.headers = headers;

    const resp = await fetcher(url, init);

    if (resp.ok) {
      return (await resp.json()) as ValidJSON;
    }

    if (resp.headers.get("content-type") === "application/json") {
      const body = await resp.json();

      throw new RPError(body.message, resp.status, body.data);
    }

    throw new Error("Response content-type was not JSON");
  };
}
