import { Loan, RepaymentMethod, SimulationResult } from '../types';

/**
 * Calculates the monthly payment for a loan.
 * Returns the payment for the *next* month.
 */
export const calculateMonthlyPayment = (loan: Loan): number => {
  const r = loan.rate / 100 / 12;
  const n = loan.remainingMonths;

  if (loan.balance <= 0 || n <= 0) return 0;

  if (loan.method === RepaymentMethod.EQUAL_PAYMENT) {
    // P * r * (1+r)^n / ((1+r)^n - 1)
    return (loan.balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  } else {
    // Equal Principal: Monthly Principal + Interest on remaining
    const monthlyPrincipal = loan.balance / n;
    const interest = loan.balance * r;
    return monthlyPrincipal + interest;
  }
};

/**
 * Calculates total remaining interest for a loan schedule.
 */
export const calculateTotalInterest = (loan: Loan): number => {
  const r = loan.rate / 100 / 12;
  const n = loan.remainingMonths;
  
  if (loan.balance <= 0 || n <= 0) return 0;

  if (loan.method === RepaymentMethod.EQUAL_PAYMENT) {
    const monthly = calculateMonthlyPayment(loan);
    return (monthly * n) - loan.balance;
  } else {
    // Equal Principal: Total Interest = (n+1) * balance * r / 2
    return ((n + 1) * loan.balance * r) / 2;
  }
};

/**
 * Sniper Mode: Allocates repayment amount to the loan with the highest interest rate first.
 */
export const distributeRepayment = (loans: Loan[], amount: number): Map<string, number> => {
  // Sort by rate descending
  const sortedLoans = [...loans].sort((a, b) => b.rate - a.rate);
  const allocation = new Map<string, number>();
  let remainingAmount = amount;

  for (const loan of sortedLoans) {
    if (remainingAmount <= 0) break;
    const pay = Math.min(remainingAmount, loan.balance);
    allocation.set(loan.id, pay);
    remainingAmount -= pay;
  }
  return allocation;
};

/**
 * Simulates repayment strategy (Option A: Shorten Term vs Option B: Reduce Payment)
 */
export const simulateRepayment = (
  loans: Loan[], 
  repayAmount: number, 
  strategy: 'SHORTEN_TERM' | 'REDUCE_PAYMENT'
): SimulationResult => {
  const allocation = distributeRepayment(loans, repayAmount);
  
  let totalInterestBefore = 0;
  let totalInterestAfter = 0;
  let currentMonthlyPayment = 0;
  let newMonthlyPayment = 0;

  // Before calculation
  loans.forEach(l => {
    totalInterestBefore += calculateTotalInterest(l);
    currentMonthlyPayment += calculateMonthlyPayment(l);
  });

  // After calculation logic
  loans.forEach(loan => {
    const payAmount = allocation.get(loan.id) || 0;
    const newBalance = Math.max(0, loan.balance - payAmount);
    
    // Create a virtual loan for calculation
    const tempLoan = { ...loan, balance: newBalance };
    
    if (strategy === 'SHORTEN_TERM') {
        // Keep monthly payment (approx) same, reduce N
        // For Equal Payment: n = -log(1 - (r*P/Monthly)) / log(1+r)
        if (newBalance > 0) {
           const r = tempLoan.rate / 100 / 12;
           const oldMonthly = calculateMonthlyPayment(loan); // Try to maintain this
           
           if (tempLoan.method === RepaymentMethod.EQUAL_PAYMENT) {
               // Recalculate N based on old monthly payment
               // If oldMonthly < interest, math breaks (impossible to repay). Guard against this.
               const interestOnly = newBalance * r;
               if (oldMonthly > interestOnly) {
                   const n = -Math.log(1 - (newBalance * r / oldMonthly)) / Math.log(1 + r);
                   tempLoan.remainingMonths = Math.ceil(n);
               } else {
                   // Fallback if mathematically weird (shouldn't happen with standard loans)
                   tempLoan.remainingMonths = loan.remainingMonths; 
               }
           } else {
                // Equal Principal: Keep principal part same? Usually banks just shorten term keeping monthly roughly similar or recalculate.
                // Simplified: Reduce N proportionally to balance reduction to keep "intensity" high
                // Actually, standard Chinese bank "Shorten Term" keeps the monthly payment amount roughly similar to before.
                // For Equal Principal, we just reduce N.
                const originalPrincipalPart = loan.balance / loan.remainingMonths;
                tempLoan.remainingMonths = Math.ceil(newBalance / originalPrincipalPart);
           }
        } else {
            tempLoan.remainingMonths = 0;
        }
    } else {
        // 'REDUCE_PAYMENT': Keep N constant, reduce Monthly
        // N remains same (unless fully paid)
        if (newBalance === 0) tempLoan.remainingMonths = 0;
    }

    totalInterestAfter += calculateTotalInterest(tempLoan);
    newMonthlyPayment += calculateMonthlyPayment(tempLoan);
  });

  return {
    totalInterest: totalInterestAfter,
    monthlyPayment: newMonthlyPayment,
    monthsSaved: 0, // Complex to aggregate across portfolio, usually displayed per loan. We can omit or average.
    totalSaved: Math.max(0, totalInterestBefore - totalInterestAfter)
  };
};
