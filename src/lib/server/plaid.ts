import "server-only";

import {
  Configuration,
  CountryCode,
  CreditAccountSubtype,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type Transaction,
} from "plaid";
import { env } from "@/lib/server/env";
import { normalizeCategory, type SmartSwipeCategory } from "@/lib/server/cardCatalog";

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": env.PLAID_CLIENT_ID,
        "PLAID-SECRET": env.PLAID_SECRET,
      },
    },
  })
);

export async function createLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "CardIQ",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
    account_filters: {
      credit: {
        account_subtypes: [CreditAccountSubtype.CreditCard],
      },
    },
  });

  return response.data.link_token;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type PlaidErrorLike = {
  response?: {
    data?: {
      error_code?: string;
    };
  };
};

export async function getTransactionsWithRetry(accessToken: string, retries = 5): Promise<Transaction[]> {
  for (let index = 0; index < retries; index += 1) {
    try {
      const { data } = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: "2025-01-01",
        end_date: new Date().toISOString().slice(0, 10),
      });
      return data.transactions;
    } catch (error) {
      const code = (error as PlaidErrorLike)?.response?.data?.error_code;
      if (code === "PRODUCT_NOT_READY" && index < retries - 1) {
        await delay(1500);
        continue;
      }
      throw error;
    }
  }
  return [];
}

function inferCategoryFromText(value: string): SmartSwipeCategory {
  const input = value.toLowerCase();
  if (input.includes("restaurant") || input.includes("dining") || input.includes("coffee") || input.includes("fast food")) return "dining";
  if (input.includes("grocery") || input.includes("supermarket")) return "groceries";
  if (input.includes("air") || input.includes("hotel") || input.includes("travel") || input.includes("transport")) return "travel";
  if (input.includes("gas") || input.includes("fuel")) return "gas";
  if (input.includes("movie") || input.includes("stream") || input.includes("entertainment")) return "entertainment";
  return "other";
}

export function inferCategoryFromTransaction(transaction: Transaction): SmartSwipeCategory {
  const detailed = transaction.personal_finance_category?.detailed;
  const primary = transaction.personal_finance_category?.primary;
  const legacy = Array.isArray(transaction.category) ? transaction.category.join(" ") : "";
  const merchant = transaction.merchant_name ?? transaction.name ?? "";

  return (
    normalizeCategory(detailed) ??
    normalizeCategory(primary) ??
    normalizeCategory(legacy) ??
    inferCategoryFromText(`${detailed ?? ""} ${primary ?? ""} ${legacy} ${merchant}`)
  );
}

export function summarizeTransactions(transactions: Transaction[]) {
  return transactions.map((transaction) => ({
    transactionId: transaction.transaction_id,
    accountId: transaction.account_id,
    merchant: transaction.merchant_name ?? transaction.name,
    amount: transaction.amount,
    date: transaction.date,
    category: inferCategoryFromTransaction(transaction),
    pending: transaction.pending,
  }));
}
