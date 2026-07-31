import { useNavigate } from 'react-router-dom';
import {
  WireButton,
  WireInput,
  WireCard,
  WireBadge,
  WireSidebar,
  WireHeader,
  ScreenContainer,
} from '../components/WireframeUI';
import { Search, Download, ChevronDown, Check, AlertTriangle, Info, X } from 'lucide-react';
import { ROUTES } from '../constants/routes';

export const Screen6 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-6" title="SCREEN 6 - CLAIMS PIPELINE PAGE">
      <div className="flex h-full">
        <WireSidebar activeId="nav-pipeline" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 flex flex-col bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase border-b-2 border-gray-800 pb-2">
                Claims Pipeline
              </h2>
              <WireButton variant="outline">
                <Download className="w-4 h-4" /> Export Report
              </WireButton>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <WireInput placeholder="Search patient name or reference number" icon={Search} />
              </div>
              <div className="w-48 border-2 border-gray-800 bg-white px-3 py-2 flex justify-between items-center text-sm font-bold">
                <span>All Schemes</span> <ChevronDown className="w-4 h-4" />
              </div>
              <div className="w-48 border-2 border-gray-800 bg-white px-3 py-2 flex justify-between items-center text-sm font-bold">
                <span>All Statuses</span> <ChevronDown className="w-4 h-4" />
              </div>
              <div className="w-48 border-2 border-gray-800 bg-white px-3 py-2 flex justify-between items-center text-sm font-bold">
                <span>All Stages</span> <ChevronDown className="w-4 h-4" />
              </div>
              <div className="w-48 border-2 border-gray-800 bg-white px-3 py-2 flex justify-between items-center text-sm font-bold">
                <span>Last 30 Days</span> <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <WireCard className="flex-1 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b-2 border-gray-800">
                      <th className="pb-2 px-2">Patient Name</th>
                      <th className="pb-2 px-2">Age</th>
                      <th className="pb-2 px-2">Insurance Scheme</th>
                      <th className="pb-2 px-2">Stage</th>
                      <th className="pb-2 px-2">Procedure</th>
                      <th className="pb-2 px-2">Amount Requested</th>
                      <th className="pb-2 px-2">Amount Approved</th>
                      <th className="pb-2 px-2">Status</th>
                      <th className="pb-2 px-2">Days Open</th>
                      <th className="pb-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: 'Rajesh Kumar',
                        age: 45,
                        scheme: 'Star Health',
                        stage: 'Pre-Auth',
                        proc: 'Appendectomy',
                        req: '₹45,000',
                        app: '-',
                        status: 'Extracting',
                        days: 0,
                        action: 'View',
                      },
                      {
                        name: 'Meena Devi',
                        age: 62,
                        scheme: 'CMCHIS',
                        stage: 'Pre-Auth',
                        proc: 'Cataract',
                        req: '₹25,000',
                        app: '-',
                        status: 'Submitted',
                        days: 1,
                        action: 'View',
                      },
                      {
                        name: 'Suresh V.',
                        age: 38,
                        scheme: 'HDFC Ergo',
                        stage: 'Pre-Auth',
                        proc: 'Hernia',
                        req: '₹60,000',
                        app: '-',
                        status: 'Pending Response',
                        days: 2,
                        action: 'View',
                      },
                      {
                        name: 'John D.',
                        age: 55,
                        scheme: 'Care Health',
                        stage: 'Discharge',
                        proc: 'Knee Replace',
                        req: '₹1,20,000',
                        app: '₹1,20,000',
                        status: 'Approved',
                        days: 4,
                        action: 'View',
                      },
                      {
                        name: 'Mohammed A.',
                        age: 41,
                        scheme: 'ICICI Lombard',
                        stage: 'Final Claim',
                        proc: 'Gallbladder',
                        req: '₹80,000',
                        app: '₹70,000',
                        status: 'Partial Approval',
                        days: 12,
                        action: 'View',
                      },
                      {
                        name: 'Anita S.',
                        age: 29,
                        scheme: 'Star Health',
                        stage: 'Pre-Auth',
                        proc: 'Maternity',
                        req: '₹50,000',
                        app: '-',
                        status: 'Rejected - Attempt 1',
                        days: 3,
                        action: 'Review',
                      },
                      {
                        name: 'Kavitha R.',
                        age: 50,
                        scheme: 'HDFC Ergo',
                        stage: 'Final Claim',
                        proc: 'Cardiac',
                        req: '₹2,50,000',
                        app: '-',
                        status: 'Rejected - Attempt 2',
                        days: 15,
                        action: 'Review',
                      },
                      {
                        name: 'Vikram S.',
                        age: 68,
                        scheme: 'SBI General',
                        stage: 'Discharge',
                        proc: 'Hip Replace',
                        req: '₹1,80,000',
                        app: '-',
                        status: 'Escalated to Employee',
                        days: 8,
                        action: 'Review',
                      },
                      {
                        name: 'Priya M.',
                        age: 34,
                        scheme: 'Star Health',
                        stage: 'Final Claim',
                        proc: 'Thyroid',
                        req: '₹40,000',
                        app: '₹40,000',
                        status: 'Complete',
                        days: 21,
                        action: 'View',
                      },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-gray-300 ${row.status.includes('Rejected') || row.status.includes('Escalated') ? 'bg-gray-100' : ''}`}
                      >
                        <td className="py-3 px-2 font-bold">{row.name}</td>
                        <td className="px-2">{row.age}</td>
                        <td className="px-2">{row.scheme}</td>
                        <td className="px-2">{row.stage}</td>
                        <td className="px-2">{row.proc}</td>
                        <td className="px-2">{row.req}</td>
                        <td className="px-2 font-bold">{row.app}</td>
                        <td className="px-2">
                          <WireBadge
                            variant={
                              row.status.includes('Rejected') || row.status.includes('Escalated')
                                ? 'high'
                                : 'default'
                            }
                          >
                            {row.status}
                          </WireBadge>
                        </td>
                        <td className="px-2">{row.days}</td>
                        <td className="px-2 text-right">
                          <WireButton
                            id={
                              row.action === 'View'
                                ? i === 0
                                  ? 'btn-6-view'
                                  : undefined
                                : i === 5
                                  ? 'btn-6-review'
                                  : undefined
                            }
                            variant={row.action === 'Review' ? 'secondary' : 'outline'}
                            onClick={() =>
                              navigate(
                                row.action === 'Review' ? ROUTES.MANUAL_REVIEW : ROUTES.CLAIM_DETAIL
                              )
                            }
                            className="px-3 py-1 text-xs inline-flex"
                          >
                            {row.action}
                          </WireButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-4 border-t-2 border-gray-800 flex justify-between items-center mt-auto">
                <span className="text-sm font-bold text-gray-500">Showing 1-9 of 1,284 claims</span>
                <div className="flex gap-2">
                  <WireButton variant="outline" className="px-3 py-1 text-xs">
                    Previous
                  </WireButton>
                  <WireButton variant="secondary" className="px-3 py-1 text-xs">
                    1
                  </WireButton>
                  <WireButton variant="outline" className="px-3 py-1 text-xs">
                    2
                  </WireButton>
                  <WireButton variant="outline" className="px-3 py-1 text-xs">
                    3
                  </WireButton>
                  <WireButton variant="outline" className="px-3 py-1 text-xs">
                    Next
                  </WireButton>
                </div>
              </div>
            </WireCard>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen11 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-11" title="SCREEN 11 - CLAIM DETAIL PAGE">
      <div className="flex h-full">
        <WireSidebar activeId="nav-pipeline" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold uppercase mb-2">Claim Detail</h2>
                <p className="text-sm text-gray-600">Ref: CLM-2023-889900</p>
              </div>
              <div className="flex gap-2">
                <WireButton variant="outline">
                  <Download className="w-4 h-4" /> Download Full Report
                </WireButton>
                <WireButton
                  id="btn-11-escalate"
                  variant="secondary"
                  onClick={() => navigate(ROUTES.MANUAL_REVIEW)}
                >
                  <AlertTriangle className="w-4 h-4" /> Escalate to Manual
                </WireButton>
                <WireButton variant="primary" onClick={() => navigate(ROUTES.PIPELINE)}>
                  Back to Pipeline
                </WireButton>
              </div>
            </div>

            <WireCard title="Patient Info">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Patient</p>
                  <p className="font-bold text-lg">Rajesh Kumar, 45M</p>
                  <p className="text-sm text-gray-600">ID: HOSP-12345</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Insurance</p>
                  <p className="font-bold text-lg">Star Health</p>
                  <p className="text-sm text-gray-600">Pol: SH-99887766</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Procedure</p>
                  <p className="font-bold text-lg">Appendectomy</p>
                  <p className="text-sm text-gray-600">Est: ₹45,000</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                  <WireBadge variant="default" className="mt-1 inline-block">
                    Extracting
                  </WireBadge>
                </div>
              </div>
            </WireCard>

            <WireCard title="Stage Progress Tracker">
              <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-300 -z-10 -translate-y-1/2"></div>
                <div className="absolute left-0 top-1/2 w-1/4 h-1 bg-gray-800 -z-10 -translate-y-1/2"></div>

                {[
                  { label: 'Upload', status: 'done' },
                  { label: 'OCR Extraction', status: 'active' },
                  { label: 'Validation', status: 'pending' },
                  { label: 'Submission', status: 'pending' },
                  { label: 'Insurer Review', status: 'pending' },
                  { label: 'Response', status: 'pending' },
                  { label: 'Complete', status: 'pending' },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div
                      className={`w-8 h-8 rounded-full border-4 flex items-center justify-center bg-white ${
                        step.status === 'done'
                          ? 'border-gray-800 text-gray-800'
                          : step.status === 'active'
                            ? 'border-gray-800 border-dashed animate-spin text-transparent'
                            : 'border-gray-300 text-transparent'
                      }`}
                    >
                      {step.status === 'done' && <Check className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-800 pt-6">
                <h4 className="font-bold text-sm uppercase mb-4 text-gray-600">Timeline Feed</h4>
                <div className="space-y-4">
                  <div className="flex gap-4 border-l-2 border-gray-800 pl-4 relative">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-2 border-gray-800 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-xs font-bold text-gray-500">10:45 AM - Today</div>
                      <div className="font-bold text-sm">OCR Extraction Started</div>
                      <div className="text-xs text-gray-600">
                        Processing 5 documents. Estimated time: 2 mins.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 border-l-2 border-gray-300 pl-4 relative">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div>
                      <div className="text-xs font-bold text-gray-500">10:42 AM - Today</div>
                      <div className="font-bold text-sm">Documents Uploaded</div>
                      <div className="text-xs text-gray-600">
                        Dr. Sharma uploaded 5 PDF files for Pre-Authorization.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 border-l-2 border-gray-300 pl-4 relative">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div>
                      <div className="text-xs font-bold text-gray-500">10:40 AM - Today</div>
                      <div className="font-bold text-sm">Claim Created</div>
                      <div className="text-xs text-gray-600">
                        System generated new claim record.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </WireCard>

            <WireCard title="Documents Panel">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Clinical_Notes_Rajesh.pdf', size: '2.4 MB' },
                  { name: 'StarHealth_Policy_Card.pdf', size: '1.1 MB' },
                  { name: 'Estimated_Cost_Sheet.pdf', size: '0.8 MB' },
                  { name: 'Diagnosis_Report_Lab.pdf', size: '4.2 MB' },
                  { name: 'Doctor_Prescription.pdf', size: '1.5 MB' },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="border-2 border-gray-300 p-3 flex justify-between items-center bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 border-2 border-gray-400 flex items-center justify-center">
                        <span className="text-[10px] font-bold">PDF</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <WireButton variant="outline" className="px-2 py-1 text-xs">
                        Preview
                      </WireButton>
                      <WireButton variant="outline" className="px-2 py-1 text-xs">
                        <Download className="w-3 h-3" />
                      </WireButton>
                    </div>
                  </div>
                ))}
              </div>
            </WireCard>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen10 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-10" title="SCREEN 10 - NOTIFICATIONS PANEL">
      <div className="flex h-full relative">
        <div className="flex-1 bg-gray-200 bg-opacity-50">
          {/* Background content blurred out */}
          <div className="p-8 opacity-30">
            <div className="w-full h-16 bg-white border-2 border-gray-800 mb-4"></div>
            <div className="w-full h-64 bg-white border-2 border-gray-800 mb-4"></div>
            <div className="w-full h-64 bg-white border-2 border-gray-800"></div>
          </div>
        </div>

        <div className="w-96 bg-white border-l-4 border-gray-800 shadow-[-16px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col h-full absolute right-0 top-0 z-50">
          <div className="p-6 border-b-2 border-gray-800 flex justify-between items-center bg-gray-50">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Notifications</h2>
            <button
              onClick={() => navigate(ROUTES.PIPELINE)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex border-b-2 border-gray-800 text-sm font-bold">
            <div className="flex-1 text-center py-3 border-b-4 border-gray-800 bg-gray-100">
              All
            </div>
            <div className="flex-1 text-center py-3 text-gray-500 hover:bg-gray-50 cursor-pointer">
              Action Req
            </div>
            <div className="flex-1 text-center py-3 text-gray-500 hover:bg-gray-50 cursor-pointer">
              Approvals
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {[
              {
                type: 'warning',
                patient: 'Anita S.',
                insurer: 'Star Health',
                msg: 'Claim rejected (Attempt 1). Review required.',
                time: '10 mins ago',
              },
              {
                type: 'success',
                patient: 'John D.',
                insurer: 'Care Health',
                msg: 'Discharge authorization approved.',
                time: '1 hour ago',
              },
              {
                type: 'info',
                patient: 'Rajesh K.',
                insurer: 'Star Health',
                msg: 'Pre-auth extraction complete. Validating...',
                time: '2 hours ago',
              },
              {
                type: 'warning',
                patient: 'Suresh V.',
                insurer: 'HDFC Ergo',
                msg: 'Missing data detected in pre-auth upload.',
                time: '3 hours ago',
              },
              {
                type: 'success',
                patient: 'Priya M.',
                insurer: 'Star Health',
                msg: 'Final claim payment received.',
                time: 'Yesterday',
              },
            ].map((notif, i) => (
              <div
                key={i}
                className="p-4 border-b border-gray-300 hover:bg-gray-50 cursor-pointer flex gap-4"
              >
                <div className="mt-1">
                  {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-gray-800" />}
                  {notif.type === 'success' && <Check className="w-5 h-5 text-gray-800" />}
                  {notif.type === 'info' && <Info className="w-5 h-5 text-gray-800" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 mb-1">
                    {notif.patient} • {notif.insurer}
                  </p>
                  <p className="text-sm font-bold mb-2">{notif.msg}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{notif.time}</span>
                    <WireButton
                      id={i === 0 ? 'btn-10-view' : undefined}
                      variant="outline"
                      onClick={() => navigate(ROUTES.CLAIM_DETAIL)}
                      className="px-2 py-1 text-[10px]"
                    >
                      View
                    </WireButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t-2 border-gray-800 text-center">
            <a href="#" className="text-sm font-bold hover:underline">
              Mark all as read
            </a>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};
