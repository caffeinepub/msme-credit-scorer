export interface BusinessFormData {
  businessName: string;
  gstNumber: string;
  businessAge: number;
  industry:
    | "textile"
    | "retail"
    | "kirana"
    | "manufacturing"
    | "food_processing"
    | "handicrafts";
  location: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

export type BusinessFormErrors = Partial<
  Record<keyof BusinessFormData, string>
>;

export function validateBusinessForm(
  data: BusinessFormData,
): BusinessFormErrors {
  const errors: BusinessFormErrors = {};

  if (!data.businessName || data.businessName.trim().length < 2) {
    errors.businessName = "Business name must be at least 2 characters";
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!data.gstNumber || !gstRegex.test(data.gstNumber)) {
    errors.gstNumber = "Invalid GST number format (e.g. 24AAACS7072B1Z6)";
  }

  if (
    Number.isNaN(data.businessAge) ||
    data.businessAge < 0 ||
    data.businessAge > 100
  ) {
    errors.businessAge = "Business age must be between 0 and 100 years";
  }

  const validIndustries = [
    "textile",
    "retail",
    "kirana",
    "manufacturing",
    "food_processing",
    "handicrafts",
  ];
  if (!data.industry || !validIndustries.includes(data.industry)) {
    errors.industry = "Please select an industry";
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.location = "Location must be at least 2 characters";
  }

  if (Number.isNaN(data.monthlyRevenue) || data.monthlyRevenue < 1000) {
    errors.monthlyRevenue = "Revenue must be at least ₹1,000";
  }

  if (Number.isNaN(data.monthlyExpenses) || data.monthlyExpenses < 0) {
    errors.monthlyExpenses = "Expenses cannot be negative";
  }

  return errors;
}

export interface LoginFormData {
  email: string;
  password: string;
  role: "borrower" | "admin";
}

export interface SignupFormData {
  email: string;
  password: string;
  role: "borrower" | "admin";
}

export interface CashflowFormData {
  month1Revenue: number;
  month1Expense: number;
  month2Revenue: number;
  month2Expense: number;
  month3Revenue: number;
  month3Expense: number;
}
