export type UserRole = "ADMIN" | "MANAGER" | "AGENT" | "ACCOUNTS" | "CLAIMS_OFFICER";

export type PolicyStatus = "PENDING" | "ACTIVE" | "LAPSED" | "CANCELLED" | "EXPIRED" | "CLAIMED";

export type PlanType = "WHITE" | "GOLD" | "BLUE" | "PURPLE";

export type PolicyType = "INDIVIDUAL" | "FAMILY";

export type ProposalStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type AlterationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "APPLIED";

export type AlterationType = 
  | "UPGRADE" 
  | "DOWNGRADE" 
  | "ADD_DEPENDENT" 
  | "REMOVE_DEPENDENT" 
  | "ADD_RIDER" 
  | "REMOVE_RIDER" 
  | "CHANGE_PAYMENT" 
  | "CHANGE_DETAILS";

export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REVERSED";

export type PaymentMethod = "CASH" | "EFT" | "CARD" | "DEBIT_ORDER" | "CHEQUE";

export type ClaimStatus = 
  | "PENDING" 
  | "UNDER_REVIEW" 
  | "DOCUMENTS_REQUIRED" 
  | "APPROVED" 
  | "REJECTED" 
  | "PAID" 
  | "COMPLETED";

export type ClaimType = "DEATH" | "FUNERAL" | "REPATRIATION";

export type DeceasedType = "PRINCIPAL" | "DEPENDENT";

export type Relationship = "SPOUSE" | "CHILD" | "PARENT" | "SIBLING" | "EXTENDED";

export type ServiceType = 
  | "BODY_REMOVAL" 
  | "HEARSE" 
  | "MORTUARY" 
  | "TRANSPORT" 
  | "COFFIN" 
  | "CATERING" 
  | "TENT" 
  | "CHAIRS" 
  | "PROGRAM" 
  | "FLOWERS" 
  | "TOMBSTONE" 
  | "CASH_BENEFIT";

export type DocumentType = 
  | "ID_COPY" 
  | "DEATH_CERTIFICATE" 
  | "PROPOSAL_FORM" 
  | "ALTERATION_FORM" 
  | "RECEIPT" 
  | "BANK_STATEMENT" 
  | "PROOF_OF_ADDRESS" 
  | "CLAIM_FORM" 
  | "OTHER";

export type NotificationType = 
  | "RENEWAL_REMINDER" 
  | "PENDING_APPROVAL" 
  | "CLAIM_UPDATE" 
  | "PAYMENT_DUE" 
  | "POLICY_LAPSE" 
  | "WAITING_PERIOD_END";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Client {
  id: string;
  clientNumber: string;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: Date;
  gender: string;
  maritalStatus?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  streetAddress: string;
  suburb?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  occupation?: string;
  employer?: string;
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Policy {
  id: string;
  policyNumber: string;
  clientId: string;
  policyType: PolicyType;
  planType: PlanType;
  coverAmount: number;
  premiumAmount: number;
  inceptionDate: Date;
  effectiveDate: Date;
  renewalDate?: Date;
  waitingPeriodEnd: Date;
  status: PolicyStatus;
  paymentFrequency: string;
  paymentMethod?: string;
  arrearsAmount: number;
  lastPaymentDate?: Date;
  createdAt: Date;
}

export interface Dependent {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  dateOfBirth: Date;
  gender: string;
  relationship: Relationship;
  isActive: boolean;
}

export interface PlanConfig {
  id: string;
  planType: PlanType;
  displayName: string;
  description?: string;
  principalCover: number;
  spouseCover: number;
  childCover: number;
  parentCover: number;
  extendedCover: number;
  basePremium: number;
  spousePremium: number;
  childPremium: number;
  parentPremium: number;
  extendedPremium: number;
  maxDependents: number;
  maxParents: number;
  maxExtended: number;
  naturalDeathWaiting: number;
  accidentalDeathWaiting: number;
  features?: string[];
  isActive: boolean;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalPolicies: number;
  activePolicies: number;
  pendingProposals: number;
  pendingClaims: number;
  pendingAlterations: number;
  monthlyRevenue: number;
  totalArrears: number;
  claimsPaid: number;
}

export interface ChartData {
  name: string;
  value: number;
}
