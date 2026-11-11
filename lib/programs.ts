export const PROGRAMS = [
  "Access", "Anchor", "Arrive Together", "Bayside", "Beach", "Beacon", "Brew Grounds",
  "CCBHC", "Chelsea", "Code Red/Code Blue", "CREST", "Crisis Diversion",
  "Crisis Stabilization", "Development", "Embrace", "Facilities", "FCIU", "Finance",
  "HOPES", "HSP", "Human Resources", "IIC", "IOC", "ISC", "KFT Monmouth",
  "KFT Ocean", "LEAD", "Oasis", "Ocean Academy", "On P.O.I.N.T.",
  "Outpatient (Adult)", "Outpatient (Children)", "PACT", "PATH", "Primary Care",
  "Quality Management", "REAL", "Recovery Services", "Salt Bridge Farm", "SHARE",
  "Shore Haven", "Supervised Visits", "The NOOK", "WAVE", "YEM", "YRS",
] as const;

export const EMPLOYEE_TYPES = ["Employee", "Coordinator", "Director/Admin"] as const;
export type EmployeeType = typeof EMPLOYEE_TYPES[number];

export function validPrograms(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) =>
    typeof item === "string" && PROGRAMS.includes(item as typeof PROGRAMS[number])) &&
    new Set(value).size === value.length;
}
