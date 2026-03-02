import { useAuth } from "@/contexts/AuthContext";

const DEMO_BUSINESS_ID = '302211e5-7b2c-4fb4-a5e0-a936c7f72364';
const POURHUB_BUSINESS_ID = '600d2b3e-f736-4533-8957-52aa3e8e18cc';

const FEATURE_FLAGS: Record<string, string[]> = {
  'estimate_wizard_v2': [DEMO_BUSINESS_ID],
  'xero_integration': [DEMO_BUSINESS_ID, POURHUB_BUSINESS_ID],
};

export function useFeatureFlag(flagName: string): boolean {
  const { businessId } = useAuth();
  const allowedBusinesses = FEATURE_FLAGS[flagName] ?? [];
  return businessId ? allowedBusinesses.includes(businessId) : false;
}
