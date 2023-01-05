import { after, before, describe, it } from "node:test";
import assert from "node:assert";
import type { Authorization } from "./types.js";
import { client } from "./client.js";
import { serve } from "@withcardinal/rp-server";
import { Status } from "@withcardinal/ts-std";

const spec = {
  versions: {
    "1": {
      queryProc: {
        proc: (auth: Authorization, payload: { name: string }) => {
          return { auth, payload: payload };
        },
      },
      queryError: {
        proc: () => {
          throw new Error("Something broke");
        },
      },
      mutationProc: {
        mutation: true,
        proc: (auth: Authorization, payload: { address: string }) => {
          return { auth, payload: payload };
        },
      },
      mutationError: {
        mutation: true,
        proc: () => {
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
