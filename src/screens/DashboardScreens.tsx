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
import { Upload, FileText, Activity, Download, Edit2, Trash2, Plus } from 'lucide-react';
import { ROUTES } from '../constants/routes';

export const Screen2 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-2" title="SCREEN 2 - MAIN DASHBOARD">
      <div className="flex h-full">
        <WireSidebar activeId="nav-dashboard" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">Claims This Month</div>
                <div className="text-3xl font-black mt-2">1,284</div>
                <div className="text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="border border-gray-800 px-1">+12%</span> vs last month
                </div>
              </WireCard>
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">Approval Rate</div>
                <div className="text-3xl font-black mt-2">94.2%</div>
                <div className="text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="border border-gray-800 px-1">+2.1%</span> vs last month
                </div>
              </WireCard>
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">Revenue Recovered</div>
                <div className="text-3xl font-black mt-2">₹4.2Cr</div>
                <div className="text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="border border-gray-800 px-1">+8%</span> vs last month
                </div>
              </WireCard>
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">Avg Processing Time</div>
                <div className="text-3xl font-black mt-2">14m</div>
                <div className="text-xs font-bold mt-2 flex items-center gap-1">
                  <span className="border border-gray-800 px-1">-4m</span> vs last month
                </div>
              </WireCard>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <WireCard title="Claims Requiring Attention">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-800">
                        <th className="pb-2">Patient</th>
                        <th className="pb-2">Insurer</th>
                        <th className="pb-2">Issue</th>
                        <th className="pb-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="py-3 font-bold">Ramesh K.</td>
                        <td>Star Health</td>
                        <td>
                          <WireBadge variant="high">Missing Data</WireBadge>
                        </td>
                        <td>
                          <WireButton
                            id="btn-dash-review-1"
                            variant="secondary"
                            onClick={() => navigate(ROUTES.MISSING_DATA)}
                          >
                            Review
                          </WireButton>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-3 font-bold">Anita S.</td>
                        <td>HDFC Ergo</td>
                        <td>
                          <WireBadge variant="high">Rejected</WireBadge>
                        </td>
                        <td>
                          <WireButton
                            id="btn-dash-review-2"
                            variant="secondary"
                            onClick={() => navigate(ROUTES.MANUAL_REVIEW)}
                          >
                            Review
                          </WireButton>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold">Mohammed A.</td>
                        <td>ICICI Lombard</td>
                        <td>
                          <WireBadge variant="high">Partial Approval</WireBadge>
                        </td>
                        <td>
                          <WireButton
                            id="btn-dash-review-3"
                            variant="secondary"
                            onClick={() => navigate(ROUTES.APPROVAL_CONFIRMATION)}
                          >
                            Review
                          </WireButton>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </WireCard>

                <WireCard title="Quick Actions" className="bg-gray-100">
                  <div className="flex gap-4">
                    <WireButton
                      id="btn-dash-upload-pre"
                      onClick={() => navigate(ROUTES.PRE_AUTH)}
                      className="flex-1 py-4 flex-col gap-2 h-auto"
                    >
                      <Upload className="w-6 h-6" />
                      <span>Upload Pre-Auth</span>
                    </WireButton>
                    <WireButton
                      id="btn-dash-upload-claim"
                      onClick={() => navigate(ROUTES.DISCHARGE)}
                      className="flex-1 py-4 flex-col gap-2 h-auto"
                    >
                      <FileText className="w-6 h-6" />
                      <span>Upload Claim</span>
                    </WireButton>
                    <WireButton
                      id="btn-dash-pipeline"
                      variant="secondary"
                      onClick={() => navigate(ROUTES.PIPELINE)}
                      className="flex-1 py-4 flex-col gap-2 h-auto"
                    >
                      <Activity className="w-6 h-6" />
                      <span>View Pipeline</span>
                    </WireButton>
                  </div>
                </WireCard>
              </div>

              <div className="col-span-1">
                <WireCard title="Agent Activity Feed" className="h-full">
                  <div className="space-y-4">
                    {[
                      {
                        time: '10:42 AM',
                        action: 'Pre-auth submitted',
                        details: 'Rajesh Kumar - Star Health',
                      },
                      {
                        time: '10:38 AM',
                        action: 'Claim approved',
                        details: 'Meena Devi - CMCHIS',
                      },
                      {
                        time: '10:15 AM',
                        action: 'Documents extracted',
                        details: 'Suresh V. - 4 files',
                      },
                      {
                        time: '09:55 AM',
                        action: 'Denial appealed',
                        details: 'Kavitha R. - HDFC Ergo',
                      },
                      {
                        time: '09:30 AM',
                        action: 'Discharge auth sent',
                        details: 'John D. - Care Health',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 border-l-2 border-gray-300 pl-3 relative">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-2 border-gray-800 rounded-full"></div>
                        <div>
                          <div className="text-xs font-bold text-gray-500">{item.time}</div>
                          <div className="font-bold text-sm">{item.action}</div>
                          <div className="text-xs text-gray-600">{item.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </WireCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen8 = () => (
  <ScreenContainer id="screen-8" title="SCREEN 8 - REPORTS PAGE">
    <div className="flex h-full">
      <WireSidebar activeId="nav-reports" />
      <div className="flex-1 flex flex-col">
        <WireHeader />
        <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
          <h2 className="text-2xl font-bold uppercase border-b-2 border-gray-800 pb-2">
            Reports and Analytics
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: 'Monthly Claims Summary',
                desc: 'Overview of all claims processed, approved, and rejected this month.',
              },
              {
                title: 'Insurer Performance Report',
                desc: 'Approval rates and average processing times broken down by insurer.',
              },
              {
                title: 'Denial Analysis Report',
                desc: 'Deep dive into common denial reasons and AI recovery success rates.',
              },
              {
                title: 'Revenue Recovered Report',
                desc: 'Financial summary of revenue recovered through automated appeals.',
              },
              {
                title: 'Agent Activity Log',
                desc: 'Complete audit trail of all actions taken by the AI agent.',
              },
              {
                title: 'Outstanding Receivables Aging',
                desc: 'Aging report of all claims currently pending payment from insurers.',
              },
            ].map((report, i) => (
              <WireCard key={i} title={report.title}>
                <p className="text-sm text-gray-600 mb-4 h-10">{report.desc}</p>
                <div className="flex gap-2 mt-auto">
                  <WireButton variant="secondary" className="flex-1">
                    Generate
                  </WireButton>
                  <WireButton variant="outline" className="flex-1">
                    <Download className="w-4 h-4" /> PDF
                  </WireButton>
                </div>
              </WireCard>
            ))}
          </div>

          <WireCard title="Scheduled Reports">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="pb-2">Report Name</th>
                  <th className="pb-2">Frequency</th>
                  <th className="pb-2">Recipients</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-3 font-bold">Monthly Claims Summary</td>
                  <td>1st of every month</td>
                  <td>admin@hospital.com</td>
                  <td className="text-right flex justify-end gap-2 py-2">
                    <WireButton variant="outline" className="px-2 py-1">
                      <Edit2 className="w-4 h-4" />
                    </WireButton>
                    <WireButton variant="outline" className="px-2 py-1">
                      <Trash2 className="w-4 h-4" />
                    </WireButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </WireCard>
        </div>
      </div>
    </div>
  </ScreenContainer>
);

export const Screen9 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-9" title="SCREEN 9 - SETTINGS PAGE">
      <div className="flex h-full">
        <WireSidebar activeId="nav-settings" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <h2 className="text-2xl font-bold uppercase border-b-2 border-gray-800 pb-2">
              Settings
            </h2>

            <WireCard title="Section 1 — Hospital Profile">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <WireInput placeholder="Hospital Name" defaultValue="Sri Ramakrishna Hospital" />
                <WireInput placeholder="Registration Number" defaultValue="REG-123456" />
                <WireInput
                  placeholder="Address"
                  defaultValue="Coimbatore, Tamil Nadu"
                  className="col-span-2"
                />
                <WireInput
                  placeholder="Empanelment IDs"
                  defaultValue="EMP-998877"
                  className="col-span-2"
                />
              </div>
              <WireButton className="w-48">Save Changes</WireButton>
            </WireCard>

            <WireCard title="Section 2 — Insurer Connections">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Manage API and RPA connections to insurers.</p>
                <WireButton id="btn-9-add-insurer" onClick={() => navigate(ROUTES.ADD_INSURER)}>
                  <Plus className="w-4 h-4" /> Add New Insurer
                </WireButton>
              </div>
              <table className="w-full text-left text-sm mb-4">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="pb-2">Insurer Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Last Tested</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Star Health</td>
                    <td>API</td>
                    <td>
                      <WireBadge>Connected</WireBadge>
                    </td>
                    <td>Today, 09:00 AM</td>
                    <td className="text-right flex justify-end gap-2 py-2">
                      <WireButton variant="secondary" className="px-2 py-1 text-xs">
                        Test
                      </WireButton>
                      <WireButton variant="outline" className="px-2 py-1 text-xs">
                        Edit
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">HDFC Ergo</td>
                    <td>RPA</td>
                    <td>
                      <WireBadge>Connected</WireBadge>
                    </td>
                    <td>Yesterday</td>
                    <td className="text-right flex justify-end gap-2 py-2">
                      <WireButton variant="secondary" className="px-2 py-1 text-xs">
                        Test
                      </WireButton>
                      <WireButton variant="outline" className="px-2 py-1 text-xs">
                        Edit
                      </WireButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </WireCard>

            <WireCard title="Section 3 — Notification Preferences">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                  <span className="font-bold">Email Notifications</span>
                  <div className="w-12 h-6 bg-gray-800 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                  <span className="font-bold">WhatsApp Notifications</span>
                  <div className="w-12 h-6 bg-gray-800 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                  <span className="font-bold">Dashboard Alerts</span>
                  <div className="w-12 h-6 bg-gray-800 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <WireInput placeholder="WhatsApp Number" defaultValue="+91 9876543210" />
                  <WireInput placeholder="Email for Reports" defaultValue="admin@hospital.com" />
                </div>
              </div>
            </WireCard>

            <WireCard title="Section 4 — User Management">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Manage hospital staff accounts.</p>
                <WireButton variant="secondary">
                  <Plus className="w-4 h-4" /> Add Staff
                </WireButton>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Dr. Sharma</td>
                    <td>Admin</td>
                    <td className="text-right flex justify-end gap-2 py-2">
                      <WireButton variant="outline" className="px-2 py-1 text-xs">
                        Edit
                      </WireButton>
                      <WireButton variant="outline" className="px-2 py-1 text-xs">
                        Remove
                      </WireButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </WireCard>

            <WireCard title="Section 5 — Data and Compliance">
              <div className="p-4 bg-gray-100 border-2 border-gray-800 mb-4">
                <p className="font-bold mb-1">IRDAI & DPDPA Compliant</p>
                <p className="text-sm text-gray-600">
                  All data is encrypted and stored locally in India. Audits are logged securely.
                </p>
              </div>
              <div className="flex gap-4">
                <WireButton variant="secondary">Download Audit Log</WireButton>
                <WireButton variant="outline">View Data Processing Agreement</WireButton>
              </div>
            </WireCard>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen16 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-16" title="SCREEN 16 - ADD NEW INSURER CONNECTION">
      <div className="flex h-full bg-gray-100 items-center justify-center p-8">
        <div className="w-full max-w-2xl bg-white border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] flex flex-col">
          <div className="p-6 border-b-4 border-gray-800 bg-gray-50 flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Add New Insurer</h2>
            <WireButton variant="outline" onClick={() => navigate(ROUTES.SETTINGS)}>
              Cancel
            </WireButton>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Select Insurer</label>
              <div className="border-2 border-gray-800 bg-white px-3 py-2 flex justify-between items-center">
                <span>Select from list...</span>
                <div className="w-4 h-4 border-l-2 border-b-2 border-gray-800 transform -rotate-45 mt-[-4px]"></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Connection Type</label>
              <WireInput
                placeholder="Auto-filled (API or RPA)"
                disabled
                className="bg-gray-100 opacity-70"
              />
            </div>

            <div className="p-4 border-2 border-dashed border-gray-400 bg-gray-50 space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase">API Credentials</p>
              <WireInput placeholder="API Key" />
              <WireInput placeholder="API Endpoint URL" />
              <WireInput placeholder="Hospital ID at Insurer" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <WireInput placeholder="TPA Name (if applicable)" />
              <WireInput placeholder="State Scheme (if applicable)" />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-800">
              <WireButton variant="secondary" className="flex-1">
                Test Connection
              </WireButton>
              <WireButton
                id="btn-16-save"
                onClick={() => navigate(ROUTES.SETTINGS)}
                className="flex-1"
              >
                Save and Activate
              </WireButton>
            </div>
            <p className="text-center text-sm font-bold text-green-700 hidden">
              Connection Successful!
            </p>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};
