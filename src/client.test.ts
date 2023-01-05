import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import type { Authorization } from "./types.js";
import { client } from "./client.js";
import { serve } from "@withcardinal/rp-server";

const spec = {
  versions: {
    "1": {
      queryProc: {
        proc: (auth: Authorization, payload: { name: string }) => {
          return { auth, payload: payload };
        },
      },
      mutationProc: {
        mutation: true,
        proc: (auth: Authorization, payload: { address: string }) => {
          return { auth, payload: payload };
        },
      },
    },
  },
};

const port = 8080;
const url = `http://127.0.0.1:${port}/rpc`;
let close: Awaited<ReturnType<typeof serve>>;

describe("client", () => {
  before(async () => {
    close = await serve(spec, port);
  });

  after(async () => {
    await close();
  });

  describe("mutate", () => {
    it("succeeds", async () => {
      const rpc = client<typeof spec, "1">(url, "1");

      const result = await rpc.mutate("mutationProc", {
        address: "Somewhere St.",
      });
      assert.deepStrictEqual(result.payload.address, "Somewhere St.");
    });
  });
});
