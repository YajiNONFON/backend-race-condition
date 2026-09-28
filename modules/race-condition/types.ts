export interface WithdrawInput {
  accountId: string;
  amount: number; // in cents, always a positive integer
}

export interface SeedAccountInput {
  ownerName: string;
  balance: number; // in cents
}
