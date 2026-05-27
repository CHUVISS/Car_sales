import { describe, it, expect } from 'vitest';

/**
 * Mirrors the canGoNext1 logic from CreateListingPage.tsx
 * Extracted here so it can be tested without React.
 */
function canGoNext1({
  year,
  price,
  mileage,
  condition,
  selectedColor,
  selectedCity,
  vin,
  licensePlate,
  acceptsCash,
  acceptsTransfer,
  viewingEnabled,
  saleAddress,
}: {
  year: string;
  price: string;
  mileage: string;
  condition: string;
  selectedColor: string;
  selectedCity: string;
  vin: string;
  licensePlate: string;
  acceptsCash: boolean;
  acceptsTransfer: boolean;
  viewingEnabled: boolean;
  saleAddress: string;
}): boolean {
  const hasIdentifier = vin.trim().length === 17 || licensePlate.trim().length > 0;
  const hasPaymentMethod = acceptsCash || acceptsTransfer;
  return Boolean(
    year && price && mileage && condition && selectedColor && selectedCity &&
    hasIdentifier && hasPaymentMethod &&
    (!viewingEnabled || saleAddress.trim().length > 0)
  );
}

const VALID_BASE = {
  year: '2020',
  price: '1500000',
  mileage: '50000',
  condition: 'good',
  selectedColor: 'white',
  selectedCity: 'moscow',
  vin: 'WVWZZZ1JZ3W386752',   // 17 chars
  licensePlate: '',
  acceptsCash: true,
  acceptsTransfer: false,
  viewingEnabled: false,
  saleAddress: '',
};

describe('CreateListingPage — step 2 validation', () => {
  it('returns true for valid complete form', () => {
    expect(canGoNext1(VALID_BASE)).toBe(true);
  });

  it('returns false when year is empty', () => {
    expect(canGoNext1({ ...VALID_BASE, year: '' })).toBe(false);
  });

  it('returns false when price is empty', () => {
    expect(canGoNext1({ ...VALID_BASE, price: '' })).toBe(false);
  });

  it('returns false when mileage is empty', () => {
    expect(canGoNext1({ ...VALID_BASE, mileage: '' })).toBe(false);
  });

  it('returns false when condition is not selected', () => {
    expect(canGoNext1({ ...VALID_BASE, condition: '' })).toBe(false);
  });

  it('returns false when color is not selected', () => {
    expect(canGoNext1({ ...VALID_BASE, selectedColor: '' })).toBe(false);
  });

  it('returns false when city is not selected', () => {
    expect(canGoNext1({ ...VALID_BASE, selectedCity: '' })).toBe(false);
  });
});

describe('VIN / license plate identifier validation', () => {
  it('passes with valid 17-char VIN', () => {
    expect(canGoNext1({ ...VALID_BASE, vin: 'WVWZZZ1JZ3W386752', licensePlate: '' }))
      .toBe(true);
  });

  it('fails with VIN shorter than 17 chars', () => {
    expect(canGoNext1({ ...VALID_BASE, vin: 'WVWZZZ1J', licensePlate: '' }))
      .toBe(false);
  });

  it('fails with VIN longer than 17 chars', () => {
    // VIN must be exactly 17; longer string treated as wrong length
    expect(canGoNext1({ ...VALID_BASE, vin: 'WVWZZZ1JZ3W386752X', licensePlate: '' }))
      .toBe(false);
  });

  it('passes when VIN is empty but license plate is provided', () => {
    expect(canGoNext1({ ...VALID_BASE, vin: '', licensePlate: 'А123БВ777' }))
      .toBe(true);
  });

  it('fails when both VIN and license plate are empty', () => {
    expect(canGoNext1({ ...VALID_BASE, vin: '', licensePlate: '' }))
      .toBe(false);
  });

  it('passes when both VIN (17 chars) and license plate are provided', () => {
    expect(canGoNext1({ ...VALID_BASE, vin: 'WVWZZZ1JZ3W386752', licensePlate: 'А123БВ' }))
      .toBe(true);
  });
});

describe('Payment method validation', () => {
  it('fails when neither cash nor transfer is selected', () => {
    expect(canGoNext1({ ...VALID_BASE, acceptsCash: false, acceptsTransfer: false }))
      .toBe(false);
  });

  it('passes when only cash is selected', () => {
    expect(canGoNext1({ ...VALID_BASE, acceptsCash: true, acceptsTransfer: false }))
      .toBe(true);
  });

  it('passes when only transfer is selected', () => {
    expect(canGoNext1({ ...VALID_BASE, acceptsCash: false, acceptsTransfer: true }))
      .toBe(true);
  });

  it('passes when both payment methods are selected', () => {
    expect(canGoNext1({ ...VALID_BASE, acceptsCash: true, acceptsTransfer: true }))
      .toBe(true);
  });
});

describe('Sale address validation (viewing enabled)', () => {
  it('fails when viewing is enabled but sale address is empty', () => {
    expect(canGoNext1({ ...VALID_BASE, viewingEnabled: true, saleAddress: '' }))
      .toBe(false);
  });

  it('fails when viewing is enabled and sale address is only whitespace', () => {
    expect(canGoNext1({ ...VALID_BASE, viewingEnabled: true, saleAddress: '   ' }))
      .toBe(false);
  });

  it('passes when viewing is enabled and sale address is provided', () => {
    expect(canGoNext1({ ...VALID_BASE, viewingEnabled: true, saleAddress: 'ул. Примерная, 1' }))
      .toBe(true);
  });

  it('passes when viewing is disabled even if sale address is empty', () => {
    expect(canGoNext1({ ...VALID_BASE, viewingEnabled: false, saleAddress: '' }))
      .toBe(true);
  });
});
