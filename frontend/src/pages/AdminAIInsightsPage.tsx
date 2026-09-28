import React, { useState, useEffect } from 'react';
import {
  aiApi,
  CustomerSegment,
  InventoryAnomaly,
  AIOverviewResponse,
  ProductAIAnalysis,
  ProductDescriptionDraft,
} from '../services/aiApi';

export const AdminAIInsightsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'inventory' | 'catalogTool'>('overview');
  const [overview, setOverview] = useState<AIOverviewResponse | null>(null);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [segmentData, setSegmentData] = useState<{
    totalCustomersAnalyzed: number;
    insufficientData: boolean;
    insufficientDataReason?: string;
  }>({ totalCustomersAnalyzed: 0, insufficientData: false });

  const [inventoryInsights, setInventoryInsights] = useState<{
    totalProductsEvaluated: number;
    insufficientData: boolean;
    insufficientDataReason?: string;
    stockoutAlerts: InventoryAnomaly[];
    slowMovingAlerts: InventoryAnomaly[];
    velocitySpikes: InventoryAnomaly[];
  }>({
    totalProductsEvaluated: 0,
    insufficientData: false,
    stockoutAlerts: [],
    slowMovingAlerts: [],
    velocitySpikes: [],
  });

  const [loading, setLoading] = useState(true);

  // Catalog assistant tool state
  const [catalogProductName, setCatalogProductName] = useState('');
  const [catalogBrand, setCatalogBrand] = useState('');
  const [catalogSpecs, setCatalogSpecs] = useState('Battery: 40 hours\nConnectivity: Bluetooth 5.2');
  const [analyzingCatalog, setAnalyzingCatalog] = useState(false);
  const [catalogAnalysis, setCatalogAnalysis] = useState<ProductAIAnalysis | null>(null);
  const [catalogDraft, setCatalogDraft] = useState<ProductDescriptionDraft | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, segRes, invRes] = await Promise.all([
        aiApi.getOverview(),
        aiApi.getCustomerSegments(),
        aiApi.getInventoryInsights(),
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (segRes.success) {
        setSegments(segRes.data.segments || []);
        setSegmentData({
          totalCustomersAnalyzed: segRes.data.totalCustomersAnalyzed,
          insufficientData: segRes.data.insufficientData,
          insufficientDataReason: segRes.data.insufficientDataReason,
        });
      }
      if (invRes.success) {
        setInventoryInsights(invRes.data);
      }
    } catch (err) {
      console.error('Failed to load AI admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCatalogAI = async () => {
    if (!catalogProductName.trim()) return;
    setAnalyzingCatalog(true);

    const parsedSpecs = catalogSpecs
      .split('\n')
      .filter((line) => line.includes(':'))
      .map((line) => {
        const [name, ...rest] = line.split(':');
        return { name: name.trim(), value: rest.join(':').trim() };
      });

    try {
      const [analyzeRes, draftRes] = await Promise.all([
        aiApi.analyzeProduct({
          name: catalogProductName,
          brand: catalogBrand,
          specifications: parsedSpecs,
        }),
        aiApi.draftDescription({
          name: catalogProductName,
          brand: catalogBrand,
          specifications: parsedSpecs,
        }),
      ]);

      if (analyzeRes.success) setCatalogAnalysis(analyzeRes.data);
      if (draftRes.success) setCatalogDraft(draftRes.data);
    } catch (err) {
      console.error('Error running catalog AI:', err);
    } finally {
      setAnalyzingCatalog(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ fontSize: '16px', color: '#64748b' }}>Loading AI Intelligence Telemetry...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          ✨ AI Intelligence & Analytics Hub
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
          Grounded RFM Customer Segmentation, Stockout Risk Forecasts, and Catalog Intelligence.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'overview' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'overview' ? '2px solid #2563eb' : 'none',
          }}
        >
          Overview & System Status
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('segments')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'segments' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'segments' ? '2px solid #2563eb' : 'none',
          }}
        >
          Customer RFM Segments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'inventory' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'inventory' ? '2px solid #2563eb' : 'none',
          }}
        >
          Inventory Velocity & Stockout Risk
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('catalogTool')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            color: activeTab === 'catalogTool' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'catalogTool' ? '2px solid #2563eb' : 'none',
          }}
        >
          Product Catalog AI Copilot
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && overview && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Active Catalog Products</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {overview.totalActiveProducts}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Customer Interactions Recorded</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {overview.totalRecordedInteractions}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Real Customer Reviews</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {overview.totalCustomerReviews}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Active AI Services & Pipelines</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overview.aiFeaturesActive.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#16a34a' }}>●</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{f.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{f.model}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontWeight: 600,
                      }}
                    >
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div>
          {segmentData.insufficientData ? (
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                color: '#475569',
              }}
            >
              <strong>RFM Segmentation Notice:</strong> {segmentData.insufficientDataReason}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Customer distribution across {segmentData.totalCustomersAnalyzed} registered customer accounts based on recency, frequency, and order volume:
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {segments.map((seg, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{seg.name}</h4>
                      <span
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '13px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {seg.count} ({seg.percentage}%)
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>{seg.description}</p>
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    >
                      <strong style={{ color: '#0f172a' }}>AI Strategy:</strong>
                      <div style={{ color: '#2563eb', marginTop: '2px' }}>{seg.actionRecommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div>
          {inventoryInsights.insufficientData ? (
            <div
              style={{
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                border: '1px solid #fde68a',
                color: '#92400e',
              }}
            >
              <strong>Demand Forecast Status:</strong> {inventoryInsights.insufficientDataReason}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Critical Alerts */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#991b1b', marginBottom: '12px' }}>
                  🚨 Stockout Risk Alerts
                </h3>
                {inventoryInsights.stockoutAlerts.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>No products currently at immediate stockout risk.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {inventoryInsights.stockoutAlerts.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#991b1b' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#b91c1c' }}>{item.reason}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>
                            {item.currentStock} in stock
                          </div>
                          <div style={{ fontSize: '11px', color: '#7f1d1d' }}>
                            {item.daysOfInventoryRemaining} days remaining
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Slow Moving Inventory */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                  📦 Slow-Moving Stock Alerts
                </h3>
                {inventoryInsights.slowMovingAlerts.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>No excessive stagnant inventory identified.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {inventoryInsights.slowMovingAlerts.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.reason}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#64748b' }}>
                          {item.currentStock} units
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catalog Copilot Tab */}
      {activeTab === 'catalogTool' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Input Form */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Catalog Copilot Input</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Product Title
                </label>
                <input
                  type="text"
                  value={catalogProductName}
                  onChange={(e) => setCatalogProductName(e.target.value)}
                  placeholder="e.g. Ergonomic Office Chair"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  value={catalogBrand}
                  onChange={(e) => setCatalogBrand(e.target.value)}
                  placeholder="e.g. Steelcase"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Specifications (Key: Value per line)
                </label>
                <textarea
                  rows={4}
                  value={catalogSpecs}
                  onChange={(e) => setCatalogSpecs(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
              <button
                type="button"
                onClick={handleRunCatalogAI}
                disabled={!catalogProductName.trim() || analyzingCatalog}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: !catalogProductName.trim() || analyzingCatalog ? 'not-allowed' : 'pointer',
                  opacity: !catalogProductName.trim() || analyzingCatalog ? 0.6 : 1,
                  marginTop: '8px',
                }}
              >
                {analyzingCatalog ? 'Analyzing with AI...' : '✨ Generate Suggestions & Grounded Draft'}
              </button>
            </div>
          </div>

          {/* AI Output Preview */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>AI Generated Results</h3>
            {!catalogAnalysis && !catalogDraft && (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                Enter product details on the left and click Generate to see category classification, verified tags, and grounded description draft.
              </div>
            )}

            {catalogAnalysis && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Category Suggestion:</div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                  {catalogAnalysis.suggested_category}
                  {catalogAnalysis.suggested_subcategory ? ` > ${catalogAnalysis.suggested_subcategory}` : ''}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Proposed Tags: </span>
                  {catalogAnalysis.suggested_tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#f1f5f9',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        marginRight: '4px',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {catalogDraft && (
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Grounded Description Draft:</div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginTop: '4px' }}>
                  {catalogDraft.full_description}
                </p>
                {catalogDraft.feature_bullet_points && (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
                    {catalogDraft.feature_bullet_points.map((bp, bpIdx) => (
                      <li key={bpIdx} style={{ marginBottom: '4px' }}>
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
