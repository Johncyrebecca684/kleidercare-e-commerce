// Master configuration, taxonomy, and datasets for the Quotes Module
// Clean production configuration without mock data

export const QUOTE_CUSTOMERS = [];

export const QUOTE_EXECUTIVES = [];

export const QUOTE_PRODUCTS = [];

export const QUOTE_UNITS = [
  "-",
  "GB",
  "L/S",
  "Mtrs",
  "No",
  "NOS",
  "One time Installation",
  "TB",
  "Yearly Renewal"
];

export const QUOTE_TAX_OPTIONS = [
  { label: "OUTPUT SGST - 0", rate: 0, type: "SGST" },
  { label: "OUTPUT SGST - 2.5 :2.5%", rate: 2.5, type: "SGST" },
  { label: "OUTPUT SGST - 6 :6%", rate: 6, type: "SGST" },
  { label: "OUTPUT SGST - 9 :9%", rate: 9, type: "SGST" },
  { label: "OUTPUT SGST - 14 :14%", rate: 14, type: "SGST" },
  { label: "OUTPUT SGST - NIL RATED", rate: 0, type: "SGST" },
  { label: "OUTPUT SGST - EXEMPTED", rate: 0, type: "SGST" },
  { label: "OUTPUT SGST - NON GST", rate: 0, type: "SGST" },
  { label: "OUTPUT CGST - 0", rate: 0, type: "CGST" },
  { label: "OUTPUT CGST - 2.5 :2.5%", rate: 2.5, type: "CGST" },
  { label: "OUTPUT CGST - 6 :6%", rate: 6, type: "CGST" },
  { label: "OUTPUT CGST - 9 :9%", rate: 9, type: "CGST" },
  { label: "OUTPUT CGST - 14 :14%", rate: 14, type: "CGST" },
  { label: "OUTPUT CGST - NIL RATED", rate: 0, type: "CGST" },
  { label: "OUTPUT CGST - EXEMPTED", rate: 0, type: "CGST" },
  { label: "OUTPUT CGST - NON GST", rate: 0, type: "CGST" },
  { label: "GST 18% (CGST 9% + SGST 9%)", rate: 18, type: "BOTH" },
  { label: "IGST 5%", rate: 5, type: "IGST" },
  { label: "IGST 12%", rate: 12, type: "IGST" },
  { label: "IGST 18%", rate: 18, type: "IGST" },
  { label: "IGST 28%", rate: 28, type: "IGST" }
];

export const QUOTE_SALES_TYPES = ["B2B", "B2C", "EXPORT", "ADV PAYMENT"];
export const QUOTE_SUPPLY_TYPES = ["Select a Supply Type", "Inter-State", "Intra-State", "Export Exempted"];
export const QUOTE_SETTING_IDS = ["GST Quote", "KC"];
export const QUOTE_PRICELISTS = ["Default Sale Price", "Cost Price"];

export const INITIAL_QUOTES = [];
