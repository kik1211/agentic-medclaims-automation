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
import { Upload, FileText, Check, AlertTriangle, Clock, Loader2, ArrowRight } from 'lucide-react';
import { ROUTES } from '../constants/routes';

export const Screen3 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-3" title="SCREEN 3 - PRE-AUTHORIZATION PAGE">
      <div className="flex h-full">
        <WireSidebar activeId="nav-pre-auth" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <WireCard title="Pre-Authorization Document Upload">
              <div className="border-4 border-dashed border-gray-400 bg-gray-100 p-12 flex flex-col items-center justify-center text-center mb-4">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Drag and drop patient PDF files here</h3>
                <p className="text-gray-500 mb-6">or click to browse</p>
                <WireButton variant="secondary">Browse Files</WireButton>
              </div>
              <p className="text-sm text-gray-500 text-center mb-6">
                Upload separate PDF per patient. Accepted format: PDF only. Max size: 20MB per file.
              </p>

              <div className="flex justify-center mb-6">
                <WireButton
                  id="btn-upload-start"
                  onClick={() => navigate(ROUTES.PROCESSING)}
                  className="px-8 py-3 text-lg"
                >
                  Upload and Start Processing
                </WireButton>
              </div>

              <div className="bg-gray-100 p-4 border-2 border-gray-800">
                <h4 className="font-bold text-sm uppercase mb-3 text-gray-600">
                  Required Documents Checklist
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Clinical Notes
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Insurance Policy ID
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Estimated Cost Sheet
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Diagnosis Report
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Doctor Prescription
                  </div>
                </div>
              </div>
            </WireCard>

            <WireCard title="Pre-Auth Queue">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="pb-2">Patient Name</th>
                    <th className="pb-2">Insurance Scheme</th>
                    <th className="pb-2">Uploaded Time</th>
                    <th className="pb-2">Documents</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Rajesh Kumar</td>
                    <td>Star Health</td>
                    <td>10:42 AM</td>
                    <td>5 files</td>
                    <td>
                      <WireBadge variant="default">Extracting</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.PROCESSING)}
                        className="px-3 py-1 text-xs"
                      >
                        View Progress
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Meena Devi</td>
                    <td>CMCHIS</td>
                    <td>10:30 AM</td>
                    <td>4 files</td>
                    <td>
                      <WireBadge variant="default">Validating</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.PROCESSING)}
                        className="px-3 py-1 text-xs"
                      >
                        View Progress
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    <td className="py-3 font-bold">Suresh V.</td>
                    <td>HDFC Ergo</td>
                    <td>09:15 AM</td>
                    <td>3 files</td>
                    <td>
                      <WireBadge variant="high">Missing Data</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        id="btn-row-missing"
                        variant="secondary"
                        onClick={() => navigate(ROUTES.MISSING_DATA)}
                        className="px-3 py-1 text-xs"
                      >
                        Complete Now
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Kavitha R.</td>
                    <td>ICICI Lombard</td>
                    <td>Yesterday</td>
                    <td>6 files</td>
                    <td>
                      <WireBadge variant="default">Submitted to Insurer</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.CLAIM_DETAIL)}
                        className="px-3 py-1 text-xs"
                      >
                        Track
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    <td className="py-3 font-bold">John D.</td>
                    <td>Care Health</td>
                    <td>Yesterday</td>
                    <td>5 files</td>
                    <td>
                      <WireBadge variant="default">Approved</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        id="btn-row-approved"
                        variant="secondary"
                        onClick={() => navigate(ROUTES.APPROVAL_CONFIRMATION)}
                        className="px-3 py-1 text-xs"
                      >
                        View Approval
                      </WireButton>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold">Anita S.</td>
                    <td>Star Health</td>
                    <td>2 days ago</td>
                    <td>5 files</td>
                    <td>
                      <WireBadge variant="high">Rejected</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        id="btn-row-rejected"
                        variant="secondary"
                        onClick={() => navigate(ROUTES.MANUAL_REVIEW)}
                        className="px-3 py-1 text-xs"
                      >
                        Review
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

export const Screen3A = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-3a" title="SCREEN 3A - PRE-AUTH PROCESSING STATE">
      <div className="flex h-full bg-gray-800 bg-opacity-90 items-center justify-center p-8">
        <div className="w-full max-w-5xl bg-white border-4 border-gray-800 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[600px]">
          <div className="p-6 border-b-4 border-gray-800 bg-gray-50 flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              Agent Processing — 3 Documents Uploaded
            </h2>
            <div className="text-sm font-bold bg-gray-200 px-3 py-1 border-2 border-gray-800">
              Extraction Confidence: 94%
            </div>
          </div>

          <div className="p-8 flex-1 flex gap-6 overflow-x-auto">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="min-w-[300px] border-4 border-gray-800 bg-white flex flex-col h-full"
              >
                <div className="p-4 border-b-2 border-gray-800 bg-gray-100 font-bold text-lg">
                  Patient {card} placeholder
                </div>
                <div className="p-6 flex-1 space-y-6">
                  <div className="flex items-center gap-3 text-gray-800 font-bold">
                    <Check className="w-5 h-5" /> <span>Step 1: OCR Extraction</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800 font-bold">
                    <Check className="w-5 h-5" /> <span>Step 2: Spell Check</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800 font-bold">
                    <Check className="w-5 h-5" /> <span>Step 3: Field Validation</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800 font-bold bg-gray-100 p-2 border-2 border-gray-800 -mx-2">
                    <Loader2 className="w-5 h-5 animate-spin" />{' '}
                    <span>Step 4: Insurer Identified</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 font-bold">
                    <Clock className="w-5 h-5" /> <span>Step 5: Submitting to Portal</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 font-bold">
                    <Clock className="w-5 h-5" /> <span>Step 6: Waiting for Response</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t-4 border-gray-800 bg-gray-50 flex justify-between items-center">
            <WireButton
              variant="secondary"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="px-6"
            >
              Go to Dashboard
            </WireButton>
            <WireButton
              id="btn-3a-pipeline"
              onClick={() => navigate(ROUTES.PIPELINE)}
              className="px-6"
            >
              View Full Pipeline <ArrowRight className="w-4 h-4" />
            </WireButton>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen4 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-4" title="SCREEN 4 - DISCHARGE AUTHORIZATION">
      <div className="flex h-full">
        <WireSidebar activeId="nav-discharge" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <WireCard title="Discharge Authorization">
              <p className="text-sm text-gray-600 mb-6">
                For patients whose surgery is complete and awaiting insurer discharge approval
              </p>
              <div className="border-4 border-dashed border-gray-400 bg-gray-100 p-12 flex flex-col items-center justify-center text-center mb-4">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Drag and drop patient PDF files here</h3>
                <p className="text-gray-500 mb-6">or click to browse</p>
                <WireButton variant="secondary">Browse Files</WireButton>
              </div>

              <div className="flex justify-center mb-6">
                <WireButton
                  onClick={() => navigate(ROUTES.PROCESSING)}
                  className="px-8 py-3 text-lg"
                >
                  Upload and Start Processing
                </WireButton>
              </div>

              <div className="bg-gray-100 p-4 border-2 border-gray-800">
                <h4 className="font-bold text-sm uppercase mb-3 text-gray-600">
                  Required Documents Checklist
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Operation Notes
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Anaesthesia Report
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Post-Op Summary
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Final Bill Draft
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Check className="w-4 h-4" /> Implant Invoice (if applicable)
                  </div>
                </div>
              </div>
            </WireCard>

            <WireCard title="Discharge Queue">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="pb-2">Patient Name</th>
                    <th className="pb-2">Insurance Scheme</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Urgency</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    <td className="py-3 font-bold">Vikram S.</td>
                    <td>HDFC Ergo</td>
                    <td>
                      <WireBadge variant="default">Extracting</WireBadge>
                    </td>
                    <td>
                      <WireBadge variant="high">HIGH - Waiting to be discharged</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.PROCESSING)}
                        className="px-3 py-1 text-xs"
                      >
                        View Progress
                      </WireButton>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Priya M.</td>
                    <td>Star Health</td>
                    <td>
                      <WireBadge variant="default">Submitted to Insurer</WireBadge>
                    </td>
                    <td>
                      <WireBadge variant="high">HIGH - Waiting to be discharged</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.CLAIM_DETAIL)}
                        className="px-3 py-1 text-xs"
                      >
                        Track
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

export const Screen5 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-5" title="SCREEN 5 - FINAL CLAIMS PAGE">
      <div className="flex h-full">
        <WireSidebar activeId="nav-final-claims" />
        <div className="flex-1 flex flex-col">
          <WireHeader />
          <div className="p-6 flex-1 overflow-auto bg-gray-50 space-y-6">
            <WireCard title="Final Claim Submission">
              <p className="text-sm text-gray-600 mb-6">
                Post-discharge final billing submitted to insurer for payment
              </p>
              <div className="border-4 border-dashed border-gray-400 bg-gray-100 p-12 flex flex-col items-center justify-center text-center mb-4">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Drag and drop patient PDF files here</h3>
                <p className="text-gray-500 mb-6">or click to browse</p>
                <WireButton variant="secondary">Browse Files</WireButton>
              </div>

              <div className="flex justify-center mb-6">
                <WireButton
                  onClick={() => navigate(ROUTES.PROCESSING)}
                  className="px-8 py-3 text-lg"
                >
                  Upload and Start Processing
                </WireButton>
              </div>

              <div className="bg-gray-100 p-4 border-2 border-gray-800">
                <h4 className="font-bold text-sm uppercase mb-3 text-gray-600">
                  Required Documents Checklist
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Discharge Summary
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Final Hospital Bill
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> All Lab Reports
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Prescription Records
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Pre-Auth Ref Number
                  </div>
                </div>
              </div>
            </WireCard>

            <WireCard title="Final Claims Queue">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="pb-2">Patient Name</th>
                    <th className="pb-2">Insurance Scheme</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-3 font-bold">Karthik R.</td>
                    <td>ICICI Lombard</td>
                    <td>
                      <WireBadge variant="default">Submitted to Insurer</WireBadge>
                    </td>
                    <td className="text-right">
                      <WireButton
                        variant="outline"
                        onClick={() => navigate(ROUTES.CLAIM_DETAIL)}
                        className="px-3 py-1 text-xs"
                      >
                        Track
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

export const Screen12 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-12" title="SCREEN 12 - MISSING DATA SCREEN">
      <div className="flex h-full bg-gray-800 bg-opacity-90 items-center justify-center p-8">
        <div className="w-full max-w-3xl bg-white border-4 border-gray-800 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="p-6 border-b-4 border-gray-800 bg-gray-50">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              Action Required — Missing Information
            </h2>
            <p className="text-lg font-bold mt-2">Patient: Suresh V. | Insurer: HDFC Ergo</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="border-2 border-gray-800 p-4 bg-gray-50 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-1" />
                <div className="flex-1">
                  <p className="font-bold">Policy Number — Not found in document</p>
                  <div className="mt-2 flex gap-4">
                    <WireInput placeholder="Type missing value directly..." className="flex-1" />
                    <WireButton variant="outline">
                      <Upload className="w-4 h-4" /> Upload Doc
                    </WireButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-800 p-4 bg-gray-50 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-1" />
                <div className="flex-1">
                  <p className="font-bold">
                    Previous Treatment Records — Required by Star Health for this procedure
                  </p>
                  <div className="mt-2 flex gap-4">
                    <WireInput
                      placeholder="Type missing value directly..."
                      className="flex-1"
                      disabled
                    />
                    <WireButton variant="secondary">
                      <Upload className="w-4 h-4" /> Upload Doc
                    </WireButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-800 p-4 bg-gray-50 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-1" />
                <div className="flex-1">
                  <p className="font-bold">Estimated Procedure Cost — Field blank</p>
                  <div className="mt-2 flex gap-4">
                    <WireInput placeholder="Type missing value directly..." className="flex-1" />
                    <WireButton variant="outline">
                      <Upload className="w-4 h-4" /> Upload Doc
                    </WireButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t-4 border-gray-800 bg-gray-50 flex justify-between items-center">
            <WireButton
              variant="outline"
              onClick={() => navigate(ROUTES.PIPELINE)}
              className="px-6 text-red-700 border-red-700 hover:bg-red-50"
            >
              Cancel and Remove This Patient
            </WireButton>
            <WireButton
              id="btn-12-submit"
              onClick={() => navigate(ROUTES.PROCESSING)}
              className="px-6"
            >
              Submit Missing Information and Continue
            </WireButton>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};

export const Screen13 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-13" title="SCREEN 13 - APPROVAL CONFIRMATION SCREEN">
      <div className="flex h-full bg-gray-100 items-center justify-center p-8">
        <div className="w-full max-w-2xl bg-white border-4 border-gray-800 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center p-12">
          <div className="w-24 h-24 border-4 border-gray-800 rounded-full flex items-center justify-center mb-6 bg-gray-100">
            <Check className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Claim Approved</h2>
          <p className="text-xl font-bold text-gray-600 mb-8">
            Patient: John D. | Insurer: Care Health
          </p>

          <div className="flex gap-8 mb-8 w-full justify-center">
            <div className="border-2 border-gray-800 p-6 bg-gray-50 flex-1">
              <p className="text-sm font-bold text-gray-500 uppercase mb-2">Amount Requested</p>
              <p className="text-3xl font-black">₹1,20,000</p>
            </div>
            <div className="border-2 border-gray-800 p-6 bg-gray-50 flex-1">
              <p className="text-sm font-bold text-gray-500 uppercase mb-2">Amount Approved</p>
              <p className="text-3xl font-black">₹1,20,000</p>
            </div>
          </div>

          <WireBadge variant="high" className="mb-6 text-lg px-4 py-2">
            Full Approval
          </WireBadge>

          <div className="text-sm font-bold text-gray-600 mb-12 border-t-2 border-gray-800 pt-6 w-full">
            <p>Approval Ref: AUTH-99887766</p>
            <p>Expected Payment Date: 12 Oct 2023</p>
          </div>

          <div className="flex gap-4 w-full">
            <WireButton variant="outline" className="flex-1 py-3">
              <FileText className="w-5 h-5" /> Download Approval Letter
            </WireButton>
            <WireButton
              variant="secondary"
              onClick={() => navigate(ROUTES.PIPELINE)}
              className="flex-1 py-3"
            >
              View in Pipeline
            </WireButton>
            <WireButton onClick={() => navigate(ROUTES.PRE_AUTH)} className="flex-1 py-3">
              Process Another Patient
            </WireButton>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};
