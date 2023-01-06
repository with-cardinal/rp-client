import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import type { Authorization } from "./types.js";
import { client } from "./client.js";
import { serve } from "@withcardinal/rp-server";
import { Status } from "@withcardinal/ts-std";

const spec = {
  versions: {
    "1": {
      queries: {
        queryProc: (auth: Authorization, payload: { name: string }) => {
          return { auth, payload: payload };
        },

        queryError: () => {
          throw new Error("Something broke");
        },
      },
      mutations: {
        mutationProc: (auth: Authorization, payload: { address: string }) => {
          return { auth, payload: payload };
        },
        mutationError: () => {
          throw new Error("Something broke");
        },
      },
    },
  },
};

const port = 8080;
const url = `http://127.0.0.1:${port}/rpc`;
let close: Awaited<ReturnType<typeof serve>>;
const rpc = client<typeof spec, "1">(url, "1");
const rpcWithAuth = client<typeof spec, "1">(url, "1", {
  scheme: "Bearer",
  token: "token",
});
describe("client", () => {
  before(async () => {
    close = await serve(spec, port);
  });

  after(async () => {
    await close();
  });

  describe("query", () => {
    it("succeeds", async () => {
      const result = await rpc.query("queryProc", {
        name: "Alan",
      });
      assert.deepStrictEqual(result.payload.name, "Alan");
    });

    it("succeeds with auth", async () => {
      const result = await rpcWithAuth.query("queryProc", {
        name: "Alan",
      });

      assert.deepStrictEqual(result.payload.name, "Alan");
      assert.deepStrictEqual(result.auth.scheme, "Bearer");
      assert.deepStrictEqual(result.auth.token, "token");
    });

    it("errors", async () => {
      await assert.rejects(async () => await rpc.query("queryError"), {
        status: Status.InternalServerError,
      });
    });
  });

  describe("mutate", () => {
    it("succeeds", async () => {
      const result = await rpc.mutate("mutationProc", {
        address: "Somewhere St.",
      });
      assert.deepStrictEqual(result.payload.address, "Somewhere St.");
    });

    it("errors", async () => {
      await assert.rejects(async () => await rpc.mutate("mutationError"), {
        status: Status.InternalServerError,
      });
    });
  });
});
