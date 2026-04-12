import { NextResponse } from "next/server";
import { Products } from "plaid";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { mergeStoredPlaidUserItem } from "@/lib/server/localStore";
import { plaidClient } from "@/lib/server/plaid";
import { resolveCardFromPlaidName } from "@/lib/server/rewards";

type SandboxSeedPayload = {
  userId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SandboxSeedPayload;
    const userId = body.userId?.trim() || DEMO_USER_ID;

    const sandboxToken = await plaidClient.sandboxPublicTokenCreate({
      institution_id: "ins_109508",
      initial_products: [Products.Transactions],
    });

    const exchange = await plaidClient.itemPublicTokenExchange({
      public_token: sandboxToken.data.public_token,
    });

    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;
    const accounts = await plaidClient.accountsGet({ access_token: accessToken });

    const creditAccounts = accounts.data.accounts.filter((account) => account.type === "credit");
    const linkedCards = (
      await Promise.all(
        creditAccounts.map(async (account) => {
          const profile = await resolveCardFromPlaidName({
            name: account.name,
            officialName: account.official_name ?? "",
          });

          if (!profile) return null;

          return {
            plaidAccountId: account.account_id,
            plaidName: account.name,
            plaidMask: account.mask ?? "0000",
            cardId: profile.cardKey,
            cardKey: profile.cardKey,
            cardName: profile.cardName ?? account.official_name ?? account.name,
            cardIssuer: profile.cardIssuer ?? undefined,
            cardNetwork: profile.cardNetwork ?? undefined,
          };
        })
      )
    ).filter((value): value is NonNullable<typeof value> => Boolean(value));

    const storedUser = await mergeStoredPlaidUserItem({
      userId,
      itemId,
      accessToken,
      linkedCards,
    });

    return NextResponse.json({
      userId,
      linkedCards,
      totalLinkedCards: storedUser.linkedCards.length,
      totalLinkedItems: storedUser.items.length,
      seeded: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("sandbox seed error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
