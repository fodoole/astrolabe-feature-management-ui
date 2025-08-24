import FeatureFlagDashboard from "../dashboard"
import AuthWrapper from "@/components/auth-wrapper"

export default function Page() {
  return (
    <AuthWrapper>
      <FeatureFlagDashboard />
    </AuthWrapper>
  )
}
