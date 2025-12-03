
export enum LoanType {
  COMMERCIAL = 'COMMERCIAL',
  PROVIDENT = 'PROVIDENT'
}

export enum RepaymentMethod {
  EQUAL_PAYMENT = 'EQUAL_PAYMENT', // Deng E Ben Xi
  EQUAL_PRINCIPAL = 'EQUAL_PRINCIPAL' // Deng E Ben Jin
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface RecurringPayment {
  amount: number;
  frequency: PaymentFrequency;
  enabled: boolean;
}

export interface Loan {
  id: string;
  type: LoanType;
  balance: number; // Remaining Principal
  rate: number; // Annual Interest Rate (percentage, e.g., 3.5)
  remainingMonths: number;
  method: RepaymentMethod;
  recurring?: RecurringPayment;
}

export interface SimulationResult {
  totalInterest: number;
  monthlyPayment: number; // Current or New first month payment
  monthsSaved: number;
  totalSaved: number;
  newEndDate?: Date;
}

export interface CityPolicy {
  name: string;
  firstHomeDownPayment: number;
  secondHomeDownPayment: number;
  firstHomeRateFloor: number;
  secondHomeRateFloor: number;
}
