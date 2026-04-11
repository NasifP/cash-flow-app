import Decimal from 'decimal.js';

export interface Participant {
  id: string;
  name: string;
  phoneNumber?: string;
  subtotal: Decimal;
  total: Decimal;
}

export interface SplitsResult {
  participants: Participant[];
  totalExtraCharges: Decimal;
  grandTotal: Decimal;
}

/**
 * Calculates the proportional share of extra charges (tax, service, delivery) 
 * for each participant based on their individual subtotal.
 * 
 * Formula: Person's Share = Subtotal + (Subtotal / Total_Subtotal) * Extra_Charges
 */
export const calculateSplits = (
  participants: { id: string; name: string; phoneNumber?: string; itemsSubtotal: number }[],
  totalExtraCharges: number
): SplitsResult => {
  const extra = new Decimal(totalExtraCharges);
  const totalSubtotal = participants.reduce(
    (acc, p) => acc.plus(new Decimal(p.itemsSubtotal)),
    new Decimal(0)
  );

  if (totalSubtotal.isZero()) {
    return {
      participants: participants.map(p => ({
        ...p,
        subtotal: new Decimal(p.itemsSubtotal),
        total: new Decimal(0),
      })),
      totalExtraCharges: extra,
      grandTotal: extra,
    };
  }

  const results = participants.map(p => {
    const sub = new Decimal(p.itemsSubtotal);
    // Proportion = individual_subtotal / total_subtotal
    const proportion = sub.dividedBy(totalSubtotal);
    // Share of extra charges
    const extraShare = proportion.times(extra);
    // Final total for this person
    const finalTotal = sub.plus(extraShare).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      id: p.id,
      name: p.name,
      phoneNumber: p.phoneNumber,
      subtotal: sub,
      total: finalTotal,
    };
  });

  const grandTotal = results.reduce(
    (acc, p) => acc.plus(p.total),
    new Decimal(0)
  );

  return {
    participants: results,
    totalExtraCharges: extra,
    grandTotal: grandTotal,
  };
};

/**
 * Formats a decimal amount as a currency string.
 */
export const formatCurrency = (amount: Decimal | number): string => {
  const val = amount instanceof Decimal ? amount.toNumber() : amount;
  return `${val.toFixed(2)} EGP`;
};
