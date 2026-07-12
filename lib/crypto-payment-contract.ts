/** Provider-neutral contract. No wallet addresses, private keys, or asset list is accepted until a reviewed provider is connected. */
export const cryptoPaymentCapability = {
  acceptedAssetCatalog: "provider_controlled",
  custody: "provider_or_user_wallet_only",
  status: "not_connected" as const,
  supportedAssets: [] as string[],
  why: "Asset availability, fees, regions, sanctions screening, and settlement rules are provider-specific and change over time.",
};
