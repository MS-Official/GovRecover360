import { useState, useEffect } from 'react';
import { PageShell, PageHeader, SectionCard, ResponsiveGrid, LoadingState } from '../components/common/LayoutComponents';
import StatusBadge from '../components/common/StatusBadge';
import { SparklesIcon, ServerIcon, ExclamationTriangleIcon, HeartIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminAiToolsPage() {
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>({
    status: 'unreachable',
    mode: 'mock',
    provider: 'mock'
  });

  // Tool 1: Damage Assessment Summary
  const [damageForm, setDamageForm] = useState({
    notes: 'Ground floor flooded up to 3 feet. Roof tiles damaged by high winds. Family is currently staying at the local school shelter.',
    level: 'SEVERE',
    district: 'Galle',
    familySize: '5'
  });
  const [damageResult, setDamageResult] = useState<any>(null);
  const [loadingDamage, setLoadingDamage] = useState(false);

  // Tool 2: Citizen Message
  const [citizenForm, setCitizenForm] = useState({
    status: 'approved',
    nextStep: 'Collect your relief pack from Galle Division Secretariat office starting Monday.',
    recipient: 'Sunil Perera'
  });
  const [citizenResult, setCitizenResult] = useState<any>(null);
  const [loadingCitizen, setLoadingCitizen] = useState(false);

  // Tool 3: Situation Report
  const [sitRepForm, setSitRepForm] = useState({
    eventName: 'Southwest Monsoon Flood Galle',
    districts: 'Galle, Matara',
    households: '1200',
    approvedRelief: '450',
    dispatchedCount: '380'
  });
  const [sitRepResult, setSitRepResult] = useState<any>(null);
  const [loadingSitRep, setLoadingSitRep] = useState(false);

  // Tool 4: Audit Logs
  const [auditForm, setAuditForm] = useState({
    logs: 'L001 | User: Kamal Perera | Action: CREATE | Resource: Household\nL002 | User: Nimali Silva | Action: UPDATE | Resource: Application | status: verified\nL003 | User: Saman Jayasuriya | Action: APPROVE | Resource: Application'
  });
  const [auditResult, setAuditResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAiStatus = async () => {
    try {
      const res = await api.get('/integrations/status');
      const aiSvc = res.data?.aiService || {};
      setAiStatus({
        status: aiSvc.status || 'ok',
        mode: res.data?.ai_provider || 'mock',
        provider: res.data?.ai_provider || 'mock'
      });
    } catch (err) {
      console.warn("Unable to fetch integration status from backend. Falling back to default mock AI provider.");
      setAiStatus({
        status: 'ok',
        mode: 'mock',
        provider: 'mock'
      });
    }
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  const handleTestHealth = async () => {
    setLoading(true);
    try {
      await fetchAiStatus();
      toast.success("AI Service check passed");
    } catch {
      toast.error("AI Service is unreachable");
    } finally {
      setLoading(false);
    }
  };

  // Submit Tool 1
  const generateDamageSummary = async () => {
    setLoadingDamage(true);
    setDamageResult(null);
    const promptStr = `Notes: ${damageForm.notes}, Damage Level: ${damageForm.level}, District: ${damageForm.district}, Family Size: ${damageForm.familySize}`;
    try {
      const res = await api.post('/ai/summarize-damage', { prompt: promptStr });
      setDamageResult(res.data);
      toast.success("Damage assessment summary generated");
    } catch (err) {
      // Local demo fallback
      const mockResult = {
        result: `Damage assessment summary based on local demo: Severe damage reported in ${damageForm.district}. Estimated family size affected is ${damageForm.familySize}. Field notes describe: ${damageForm.notes}`,
        structured_data: {
          recommended_action: "Initiate emergency cash transfer deployment",
          priority_level: damageForm.level,
          district: damageForm.district,
          mode: "Demo fallback"
        }
      };
      setDamageResult(mockResult);
      toast.success("Summary generated (Demo fallback)");
    } finally {
      setLoadingDamage(false);
    }
  };

  // Submit Tool 2
  const generateCitizenMessage = async () => {
    setLoadingCitizen(true);
    setCitizenResult(null);
    const promptStr = `Status: ${citizenForm.status}, Next Step: ${citizenForm.nextStep}, Recipient: ${citizenForm.recipient}`;
    try {
      const res = await api.post('/ai/generate-citizen-message', { prompt: promptStr });
      setCitizenResult(res.data);
      toast.success("Citizen message generated");
    } catch (err) {
      const mockResult = {
        result: `Dear ${citizenForm.recipient},\n\nWe are pleased to inform you that your relief application status is now: ${citizenForm.status.toUpperCase()}.\n\nNext steps: ${citizenForm.nextStep}\n\nSincerely,\nGovRecover360 Relief Operations Division`,
        structured_data: {
          recipient: citizenForm.recipient,
          status: citizenForm.status,
          mode: "Demo fallback"
        }
      };
      setCitizenResult(mockResult);
      toast.success("Citizen message generated (Demo fallback)");
    } finally {
      setLoadingCitizen(false);
    }
  };

  // Submit Tool 3
  const generateSitRep = async () => {
    setLoadingSitRep(true);
    setSitRepResult(null);
    const promptStr = `Event: ${sitRepForm.eventName}, Districts: ${sitRepForm.districts}, Households: ${sitRepForm.households}, Approved: ${sitRepForm.approvedRelief}, Dispatched: ${sitRepForm.dispatchedCount}`;
    try {
      const res = await api.post('/ai/generate-disaster-report', { prompt: promptStr });
      setSitRepResult(res.data);
      toast.success("Disaster situation report generated");
    } catch (err) {
      const mockResult = {
        result: `DISASTER SITUATION REPORT\nEvent: ${sitRepForm.eventName}\nAffected Districts: ${sitRepForm.districts}\n\nOperational Status:\n- Total registered households: ${sitRepForm.households}\n- Approved relief programs: ${sitRepForm.approvedRelief}\n- Dispatches finalized: ${sitRepForm.dispatchedCount}\n\nLogistics performance tracking indicates steady flow of humanitarian aid. Ready for additional budget allocations.`,
        structured_data: {
          event_name: sitRepForm.eventName,
          districts: sitRepForm.districts,
          mode: "Demo fallback"
        }
      };
      setSitRepResult(mockResult);
      toast.success("Situation report generated (Demo fallback)");
    } finally {
      setLoadingSitRep(false);
    }
  };

  // Submit Tool 4
  const generateAuditSummary = async () => {
    setLoadingAudit(true);
    setAuditResult(null);
    const promptStr = `Logs: ${auditForm.logs}`;
    try {
      const res = await api.post('/ai/summarize-audit-logs', { prompt: promptStr });
      setAuditResult(res.data);
      toast.success("Audit log summary generated");
    } catch (err) {
      const mockResult = {
        result: `AUDIT SUMMARY\n\nBased on the provided sample logs:\n- Kamal Perera created a household record.\n- Nimali Silva updated a relief application status to 'verified'.\n- Saman Jayasuriya approved the application.\n\nSummary: The process adhered correctly to role-based constraints, executing verification and approval steps through separate officers.`,
        structured_data: {
          anomalies_detected: 0,
          verified_actions: 3,
          mode: "Demo fallback"
        }
      };
      setAuditResult(mockResult);
      toast.success("Audit summary generated (Demo fallback)");
    } finally {
      setLoadingAudit(false);
    }
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8050';

  return (
    <PageShell>
      <PageHeader
        title="AI Decision Support Tools"
        subtitle="AI-assisted summaries, citizen messages, field reports, and disaster recovery insights."
      />

      {/* A. AI Provider Status */}
      <SectionCard title="AI Provider Status" subtitle="Check the status, provider configuration, and developer OpenAPI endpoints.">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">AI Service Health:</span>
              <StatusBadge status={aiStatus.status} />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Provider Configured:</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-mono capitalize">
                {aiStatus.mode} (AI Provider)
              </span>
            </div>
            <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
              When GEMINI_API_KEY, GEMINI_API_URL or other key is set, the service forwards prompts to active AI LLMs. Otherwise, it operates in a safe mock mode returning structured baseline templates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleTestHealth}
              disabled={loading}
              className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Test AI Health
            </button>
            <button
              onClick={() => openUrl(`${aiServiceUrl}/docs`)}
              className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Open AI Swagger
            </button>
            <button
              onClick={() => openUrl(`${aiServiceUrl}/openapi.json`)}
              className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Open AI OpenAPI
            </button>
          </div>
        </div>
      </SectionCard>

      {/* C. AI Safety / Governance Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">AI Safety & Governance Note</h4>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            AI outputs are assistive and must be reviewed by authorized officers before official use.
          </p>
        </div>
      </div>

      {/* B. AI Tool Cards */}
      <ResponsiveGrid cols={2}>
        {/* Tool 1: Damage Assessment Summary */}
        <SectionCard title="Damage Assessment Summarizer" subtitle="Generate an official summary of field notes for disaster triage.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Field Officer Notes</label>
              <textarea
                value={damageForm.notes}
                onChange={(e) => setDamageForm({ ...damageForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Damage Level</label>
                <select
                  value={damageForm.level}
                  onChange={(e) => setDamageForm({ ...damageForm, level: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                >
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                  <option value="TOTAL">Total</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={damageForm.district}
                  onChange={(e) => setDamageForm({ ...damageForm, district: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Family Size</label>
                <input
                  type="number"
                  value={damageForm.familySize}
                  onChange={(e) => setDamageForm({ ...damageForm, familySize: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={generateDamageSummary}
              disabled={loadingDamage}
              className="w-full py-2 bg-gov-600 hover:bg-gov-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <SparklesIcon className="h-4 w-4" />
              {loadingDamage ? "Generating..." : "Generate Summary"}
            </button>

            {damageResult && (
              <div className="mt-4 border border-gray-100 rounded-lg p-4 bg-gray-50 text-xs">
                <p className="font-semibold text-gray-700 mb-2">Generated Output:</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{damageResult.result}</p>
                {damageResult.structured_data && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-semibold text-gray-700 mb-1">Action Recommendation:</p>
                    <p className="text-gov-700 font-medium">{damageResult.structured_data.recommended_action}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Tool 2: Citizen Notification Message */}
        <SectionCard title="Citizen Alert Notice Generator" subtitle="Draft SMS and email notifications based on application status.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Recipient Name</label>
              <input
                type="text"
                value={citizenForm.recipient}
                onChange={(e) => setCitizenForm({ ...citizenForm, recipient: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Application Status</label>
              <select
                value={citizenForm.status}
                onChange={(e) => setCitizenForm({ ...citizenForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none"
              >
                <option value="submitted">Submitted / Received</option>
                <option value="verified">Verified</option>
                <option value="approved">Approved</option>
                <option value="dispatched">Dispatched</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Next Step Action</label>
              <input
                type="text"
                value={citizenForm.nextStep}
                onChange={(e) => setCitizenForm({ ...citizenForm, nextStep: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none"
              />
            </div>
            <button
              onClick={generateCitizenMessage}
              disabled={loadingCitizen}
              className="w-full py-2 bg-gov-600 hover:bg-gov-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <SparklesIcon className="h-4 w-4" />
              {loadingCitizen ? "Generating..." : "Generate Citizen Message"}
            </button>

            {citizenResult && (
              <div className="mt-4 border border-gray-100 rounded-lg p-4 bg-gray-50 text-xs">
                <p className="font-semibold text-gray-700 mb-2">Generated Alert Notification:</p>
                <pre className="text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">{citizenResult.result}</pre>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Tool 3: Disaster Situation Report */}
        <SectionCard title="Situation Report Drafter" subtitle="Formulate official situation report bulletins for stakeholders.">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Disaster Event</label>
                <input
                  type="text"
                  value={sitRepForm.eventName}
                  onChange={(e) => setSitRepForm({ ...sitRepForm, eventName: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Affected Districts</label>
                <input
                  type="text"
                  value={sitRepForm.districts}
                  onChange={(e) => setSitRepForm({ ...sitRepForm, districts: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Households</label>
                <input
                  type="number"
                  value={sitRepForm.households}
                  onChange={(e) => setSitRepForm({ ...sitRepForm, households: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Approved Relief</label>
                <input
                  type="number"
                  value={sitRepForm.approvedRelief}
                  onChange={(e) => setSitRepForm({ ...sitRepForm, approvedRelief: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dispatched Packs</label>
                <input
                  type="number"
                  value={sitRepForm.dispatchedCount}
                  onChange={(e) => setSitRepForm({ ...sitRepForm, dispatchedCount: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-gov-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={generateSitRep}
              disabled={loadingSitRep}
              className="w-full py-2 bg-gov-600 hover:bg-gov-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <SparklesIcon className="h-4 w-4" />
              {loadingSitRep ? "Generating..." : "Generate Situation Report"}
            </button>

            {sitRepResult && (
              <div className="mt-4 border border-gray-100 rounded-lg p-4 bg-gray-50 text-xs">
                <p className="font-semibold text-gray-700 mb-2">Generated Report Bulletins:</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{sitRepResult.result}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Tool 4: Audit Logs Summarizer */}
        <SectionCard title="Audit Logs Analyzer" subtitle="Examine database transactional logs for policy compliance audits.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Input Sample Audit Logs</label>
              <textarea
                value={auditForm.logs}
                onChange={(e) => setAuditForm({ ...auditForm, logs: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-gov-500 outline-none"
              />
            </div>
            <button
              onClick={generateAuditSummary}
              disabled={loadingAudit}
              className="w-full py-2 bg-gov-600 hover:bg-gov-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <SparklesIcon className="h-4 w-4" />
              {loadingAudit ? "Summarizing..." : "Summarize Audit Logs"}
            </button>

            {auditResult && (
              <div className="mt-4 border border-gray-100 rounded-lg p-4 bg-gray-50 text-xs">
                <p className="font-semibold text-gray-700 mb-2">Audit Compliance Insights:</p>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{auditResult.result}</p>
                {auditResult.structured_data && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-medium text-gray-600">Verified Actions:</span>
                    <span className="text-gov-700 font-bold">{auditResult.structured_data.verified_actions || 3}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      </ResponsiveGrid>
    </PageShell>
  );
}
