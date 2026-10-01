import { Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import AdminDashboard from '../pages/AdminDashboard'
import IssuerDashboard from '../pages/IssuerDashboard'
import CreateCertificatePage from '../pages/CreateCertificatePage'
import StudentDashboard from '../pages/StudentDashboard'
import PublicVerificationPage from '../pages/PublicVerificationPage'
import UploadVerifyPage from '../pages/UploadVerifyPage'
import VerificationResultPage from '../pages/VerificationResultPage'
import AuditLogsPage from '../pages/AuditLogsPage'
import FraudLabPage from '../pages/FraudLabPage'
import RequireAuth from '../components/RequireAuth'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
      <Route path="/issuer" element={<RequireAuth allowedRoles={['issuer']}><IssuerDashboard /></RequireAuth>} />
      <Route path="/issuer/create" element={<RequireAuth allowedRoles={['issuer']}><CreateCertificatePage /></RequireAuth>} />
      <Route path="/student" element={<RequireAuth allowedRoles={['student']}><StudentDashboard /></RequireAuth>} />
      <Route path="/verify/:certificateId" element={<PublicVerificationPage />} />
      <Route path="/verify-upload" element={<UploadVerifyPage />} />
      <Route path="/verification-result" element={<VerificationResultPage />} />
      <Route path="/audit-logs" element={<RequireAuth allowedRoles={['admin', 'issuer']}><AuditLogsPage /></RequireAuth>} />
      <Route path="/fraud-lab" element={<RequireAuth allowedRoles={['admin']}><FraudLabPage /></RequireAuth>} />
    </Routes>
  )
}

export default AppRoutes
