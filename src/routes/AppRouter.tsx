import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { OverviewCanvasPage } from '../pages/OverviewCanvasPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PreAuthPage } from '../pages/PreAuthPage';
import { ProcessingStatePage } from '../pages/ProcessingStatePage';
import { DischargeAuthPage } from '../pages/DischargeAuthPage';
import { FinalClaimsPage } from '../pages/FinalClaimsPage';
import { PipelinePage } from '../pages/PipelinePage';
import { DenialPage } from '../pages/DenialPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ClaimDetailPage } from '../pages/ClaimDetailPage';
import { MissingDataPage } from '../pages/MissingDataPage';
import { ApprovalConfirmationPage } from '../pages/ApprovalConfirmationPage';
import { ManualReviewPage } from '../pages/ManualReviewPage';
import { ErrorAnalysisPage } from '../pages/ErrorAnalysisPage';
import { AddInsurerPage } from '../pages/AddInsurerPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Independent Visual Canvas Map Route */}
        <Route path="/overview" element={<OverviewCanvasPage />} />

        {/* Auth Layout Wrapper */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Main Application Shell Wrapper */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/claims/pre-auth" element={<PreAuthPage />} />
          <Route path="/claims/processing" element={<ProcessingStatePage />} />
          <Route path="/claims/discharge" element={<DischargeAuthPage />} />
          <Route path="/claims/final" element={<FinalClaimsPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/denial" element={<DenialPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/claims/detail" element={<ClaimDetailPage />} />
          <Route path="/claims/:id" element={<ClaimDetailPage />} />
          <Route path="/claims/missing-data" element={<MissingDataPage />} />
          <Route path="/claims/approval" element={<ApprovalConfirmationPage />} />
          <Route path="/claims/manual-review" element={<ManualReviewPage />} />
          <Route path="/claims/error-analysis" element={<ErrorAnalysisPage />} />
          <Route path="/settings/add-insurer" element={<AddInsurerPage />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
