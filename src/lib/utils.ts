import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Dollars";

  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (num: number): string => {
    if ((num = num.toString().replace(/[\, ]/g, '') as any) != parseFloat(num as any)) return 'not a number';
    let x = num.toString().indexOf('.');
    if (x == -1) x = num.toString().length;
    if (x > 15) return 'too big';
    const n = num.toString().split('');
    let str = '';
    let sk = 0;
    for (let i = 0; i < x; i++) {
      if ((x - i) % 3 == 2) {
        if (n[i] == '1') {
          str += a[Number(n[i]) + Number(n[i + 1])] + ' ';
          i++; sk = 1;
        } else if (n[i] != 0 as any) {
          str += b[Number(n[i])] + ' ';
          sk = 1;
        }
      } else if (n[i] != 0 as any) {
        str += a[Number(n[i])] + ' ';
        if ((x - i) % 3 == 0) str += 'Hundred ';
        sk = 1;
      }
      if ((x - i) % 3 == 1) {
        if (sk) str += (["", "Thousand ", "Million ", "Billion "])[(x - i - 1) / 3] + ' ';
        sk = 0;
      }
    }
    return str.trim();
  };

  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  let result = inWords(dollars) + " Dollars";
  if (cents > 0) {
    result += " and " + inWords(cents) + " Cents";
  }
  return result;
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatShortDate(date: Date | string | undefined | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function generateNumber(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${dateStr}-${random}`;
}

export function calculateAge(dob: Date | string | undefined | null): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(date: Date | string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isWaitingPeriodComplete(waitingPeriodEnd: Date | string): boolean {
  return new Date() >= new Date(waitingPeriodEnd);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ACTIVE: "bg-green-100 text-green-800",
  LAPSED: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-green-100 text-green-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
};

export const PLAN_COLORS: Record<string, string> = {
  WHITE: "bg-gray-100 text-gray-800 border-gray-300",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  BLUE: "bg-blue-100 text-blue-800 border-blue-300",
  PURPLE: "bg-purple-100 text-purple-800 border-purple-300",
};

/**
 * Recursively strips `undefined` values from an object before writing to Firebase RTDB.
 * Firebase RTDB does not accept `undefined` — this converts them to `null`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = value === undefined ? null : sanitizeForFirebase(value);
  }
  return result as T;
}
