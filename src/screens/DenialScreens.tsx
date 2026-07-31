import { useNavigate } from 'react-router-dom';
import {
  WireButton,
  WireCard,
  WireBadge,
  WireSidebar,
  WireHeader,
  ScreenContainer,
} from '../components/WireframeUI';
import { ROUTES } from '../constants/routes';

export const Screen7 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-7" title="SCREEN 7 - DENIAL RECOVERY PAGE">
      <div className="flex h-full">
        <WireSidebar activeId="nav-denial" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">
                  Total Denials This Month
                </div>
                <div className="text-3xl font-black mt-2">142</div>
                <div className="text-xs font-bold mt-2 text-gray-500">11% of total claims</div>
              </WireCard>
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">
                  Successfully Recovered
                </div>
                <div className="text-3xl font-black mt-2">89</div>
                <div className="text-xs font-bold mt-2 text-gray-500">62% recovery rate via AI</div>
              </WireCard>
              <WireCard>
                <div className="text-sm font-bold text-gray-500 uppercase">Revenue Recovered</div>
                <div className="text-3xl font-black mt-2">₹1.8Cr</div>
                <div className="text-xs font-bold mt-2 text-gray-500">Saved from write-offs</div>
              </WireCard>
            </div>

            <WireCard title="Denial Reason Breakdown">
              <div className="space-y-4">
                {[
                  { reason: 'Missing Clinical Notes', pct: 35, ai: 'AI Now Prevents This' },
                  { reason: 'Procedure Not Covered', pct: 25, ai: 'Under Review' },
                  { reason: 'Incorrect Diagnosis Code', pct: 20, ai: 'AI Now Prevents This' },
                  { reason: 'Late Submission', pct: 15, ai: 'Under Review' },
                  { reason: 'Other', pct: 5, ai: 'Under Review' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-48 text-sm font-bold">{item.reason}</div>
                    <div className="flex-1 h-4 bg-gray-200 border-2 border-gray-800 relative">
                      <div
                        className="absolute left-0 top-0 h-full bg-gray-800"
                        style={{ width: `${item.pct}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-sm font-bold">{item.pct}%</div>
                    <div className="w-48 text-right">
                      <WireBadge variant={item.ai.includes('Prevents') ? 'default' : 'high'}>
                        {item.ai}
                      </WireBadge>
                    </div>
                  </div>
                ))}
              </div>
            </WireCard>

            <WireCard title="Active Denial Cases">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="pb-2">Patient</th>
                    <th className="pb-2">Insurer</th>
                    <th className="pb-2">Denial Reason</th>
                    <th className="pb-2">Attempt</th>
                    <th className="pb-2">AI Recommendation</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Anita S.</td>
                    <td>Star Health</td>
                    <td>Missing Clinical Notes</td>
                    <td>Attempt 1</td>
                    <td>
                      <WireBadge variant="default">Resubmit with Notes</WireBadge>
                    </td>
                    <td className="text-right flex justify-end gap-2 py-2">
                      <WireButton
                        id="btn-7-view-ai"
                        variant="secondary"
                        onClick={() => navigate(ROUTES.ERROR_ANALYSIS)}
                        className="px-2 py-1 text-[10px]"
                      >
                        View AI Analysis
                      </WireButton>
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.PROCESSING)}
                        className="px-2 py-1 text-[10px]"
                      >
                        Approve Resubmission
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    <td className="py-3 font-bold">Kavitha R.</td>
                    <td>HDFC Ergo</td>
                    <td>Procedure Not Covered</td>
                    <td>Attempt 2</td>
                    <td>
                      <WireBadge variant="high">Manual Escalation</WireBadge>
                    </td>
                    <td className="text-right flex justify-end gap-2 py-2">
                      <WireButton
                        id="btn-7-escalate"
                        variant="secondary"
                        onClick={() => navigate(ROUTES.MANUAL_REVIEW)}
                        className="px-2 py-1 text-[10px]"
                      >
                        Escalate to Manual
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
};

export const Screen14 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-14" title="SCREEN 14 - MANUAL REVIEW / ESCALATION SCREEN">
      <div className="flex h-full">
        <WireSidebar activeId="nav-pipeline" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase border-b-2 border-gray-800 pb-2">
                Manual Review Required
              </h2>
              <WireBadge variant="high" className="text-lg px-4 py-2">
                Escalated
              </WireBadge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <WireCard title="Claim Summary">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Patient</p>
                      <p className="font-bold">Kavitha R., 50F</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Insurer</p>
                      <p className="font-bold">HDFC Ergo</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Procedure</p>
                      <p className="font-bold">Cardiac Bypass</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Amount</p>
                      <p className="font-bold">₹2,50,000</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-800 pt-4 mt-4">
                    <h4 className="font-bold text-sm uppercase mb-2 text-gray-600">
                      Rejection History
                    </h4>
                    <div className="bg-gray-100 p-3 border-l-4 border-gray-800 mb-2">
                      <p className="text-xs font-bold text-gray-500">Attempt 1 (12 Oct)</p>
                      <p className="font-bold text-sm">Reason: Procedure Not Covered</p>
                    </div>
                    <div className="bg-gray-100 p-3 border-l-4 border-gray-800">
                      <p className="text-xs font-bold text-gray-500">Attempt 2 (15 Oct)</p>
                      <p className="font-bold text-sm">
                        Reason: Insufficient Justification for Emergency
                      </p>
                    </div>
                  </div>
                </div>
              </WireCard>

              <WireCard title="AI Analysis of Rejection">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm uppercase mb-2 text-gray-600">
                      What AI Tried to Fix
                    </h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Added Emergency Room admission notes (Attempt 1)</li>
                      <li>Highlighted "Life-threatening condition" in doctor notes (Attempt 2)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm uppercase mb-2 text-gray-600">
                      Why It Still Failed
                    </h4>
                    <p className="text-sm bg-gray-100 p-3 border-2 border-gray-800">
                      The insurer's specific policy requires a "Form 4B - Emergency Cardiac
                      Justification" which is not present in the standard document set. AI cannot
                      generate this form automatically.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm uppercase mb-2 text-gray-600">
                      Suggested Next Steps
                    </h4>
                    <ol className="list-decimal pl-5 text-sm space-y-1 font-bold">
                      <li>Doctor must fill and sign Form 4B.</li>
                      <li>Upload Form 4B to this claim.</li>
                      <li>Resubmit manually with a cover letter.</li>
                    </ol>
                  </div>
                </div>
              </WireCard>
            </div>

            <div className="flex gap-4 pt-4 border-t-2 border-gray-800">
              <WireButton
                id="btn-14-manual"
                variant="secondary"
                onClick={() => navigate(ROUTES.ERROR_ANALYSIS)}
                className="flex-1 py-3"
              >
                I Will Handle This Manually
              </WireButton>
              <WireButton variant="outline" className="flex-1 py-3">
                Contact Insurer Directly
              </WireButton>
              <WireButton variant="outline" className="flex-1 py-3">
                Raise Formal Grievance
              </WireButton>
              <WireButton
                variant="primary"
                onClick={() => navigate(ROUTES.PIPELINE)}
                className="flex-1 py-3"
              >
                Back to Pipeline
              </WireButton>
            </div>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen15 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-15" title="SCREEN 15 - AI ERROR ANALYSIS SCREEN">
      <div className="flex h-full">
        <WireSidebar activeId="nav-pipeline" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase border-b-2 border-gray-800 pb-2">
                AI Error Detection Report
              </h2>
              <div className="text-right">
                <p className="font-bold">Anita S. | Star Health</p>
                <p className="text-sm text-gray-600">Maternity Claim - ₹50,000</p>
              </div>
            </div>

            <WireCard title="Section 1 — Errors Found in Original Submission">
              <div className="space-y-3">
                <div className="flex items-start gap-4 border-b border-gray-300 pb-3">
                  <div className="w-8 h-8 bg-gray-800 text-white font-bold flex items-center justify-center rounded-full">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-bold">Missing Document</p>
                      <WireBadge variant="high">High Severity</WireBadge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      "Clinical Notes" PDF was uploaded, but pages 2 and 3 are blank.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 border-b border-gray-300 pb-3">
                  <div className="w-8 h-8 bg-gray-800 text-white font-bold flex items-center justify-center rounded-full">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-bold">Code Mismatch</p>
                      <WireBadge variant="default">Medium Severity</WireBadge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Diagnosis code O80 (Normal Delivery) conflicts with procedure code for
                      C-Section.
                    </p>
                  </div>
                </div>
              </div>
            </WireCard>

            <WireCard title="Section 2 — Cross-Reference with Accepted Claims">
              <p className="text-sm text-gray-600 mb-4">
                Comparing this submission with 450 similar accepted claims for Star Health.
              </p>
              <table className="w-full text-left text-sm border-2 border-gray-800">
                <thead>
                  <tr className="border-b-2 border-gray-800 bg-gray-100">
                    <th className="p-3 border-r-2 border-gray-800 w-1/2">Your Submission</th>
                    <th className="p-3 w-1/2">Accepted Standard</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-3 border-r-2 border-gray-800 text-red-700 font-bold">
                      Diagnosis Code: O80
                    </td>
                    <td className="p-3 text-green-700 font-bold">
                      Diagnosis Code: O82 (C-Section)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 border-r-2 border-gray-800 text-red-700 font-bold">
                      Clinical Notes: 1 Page
                    </td>
                    <td className="p-3 text-green-700 font-bold">
                      Clinical Notes: Full History (3+ Pages)
                    </td>
                  </tr>
                </tbody>
              </table>
            </WireCard>

            <WireCard title="Section 3 — Proposed Corrections">
              <ul className="list-disc pl-5 text-sm space-y-2 font-bold mb-6">
                <li>Update Diagnosis Code from O80 to O82.</li>
                <li>Attach the newly uploaded full Clinical Notes PDF.</li>
                <li>Generate a cover letter explaining the code correction.</li>
              </ul>

              <div className="flex gap-4 pt-4 border-t-2 border-gray-800">
                <WireButton
                  id="btn-15-resubmit"
                  variant="secondary"
                  onClick={() => navigate(ROUTES.PROCESSING)}
                  className="flex-1 py-3"
                >
                  Approve and Resubmit
                </WireButton>
                <WireButton
                  variant="outline"
                  onClick={() => navigate(ROUTES.MANUAL_REVIEW)}
                  className="flex-1 py-3"
                >
                  Edit Before Resubmitting
                </WireButton>
                <WireButton
                  variant="outline"
                  onClick={() => navigate(ROUTES.MANUAL_REVIEW)}
                  className="flex-1 py-3"
                >
                  Reject AI Suggestion - Handle Manually
                </WireButton>
              </div>
            </WireCard>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};
