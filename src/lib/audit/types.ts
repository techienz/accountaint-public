export type CheckStatus = "pass" | "warn" | "fail";

export type CheckCategory =
  | "Ledger"
  | "Multi-tenancy"
  | "Encryption"
  | "Data integrity"
  | "Sync"
  | "Knowledge"
  | "Email";

export type CheckDetail = {
  id: string;
  description: string;
};

export type CheckResult = {
  name: string;
  category: CheckCategory;
  status: CheckStatus;
  message: string;
  count?: number;
  details?: CheckDetail[];
  duration_ms: number;
};

export type Check = {
  name: string;
  category: CheckCategory;
  run: (businessId: string) => Promise<Omit<CheckResult, "name" | "category" | "duration_ms">>;
};
