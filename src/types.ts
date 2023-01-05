import type { ValidJSON, ValidJSONObject } from "@withcardinal/ts-std";

export type Authorization = {
  scheme: string;
  token: string;
};

export type RPSpec = {
  versions: Record<string, VersionSpec>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VersionSpec = Record<string, ProcedureSpec<any, any>>;

export type ProcedureReturn = ValidJSON | Promise<ValidJSON>;

export type ProcedureSpec<
  T extends ValidJSONObject | undefined,
  R extends ProcedureReturn
> = {
  mutation?: boolean;
  proc: Procedure<T, R>;
};

type Procedure<
  T extends ValidJSONObject | undefined,
  R extends ProcedureReturn
> = (auth: Authorization, payload: T) => R;
