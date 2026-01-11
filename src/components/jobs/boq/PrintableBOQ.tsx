import { BOQItem, BOQ_CATEGORIES, JobBOQ } from "./BOQTypes";

interface BusinessBranding {
  logo_url?: string | null;
  name?: string;
  primary_color?: string | null;
  font?: string | null;
}

interface PrintableBOQProps {
  boq: JobBOQ;
  jobName: string;
  jobNumber?: string;
  business?: BusinessBranding | null;
}

export function PrintableBOQ({ boq, jobName, jobNumber, business }: PrintableBOQProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const groupedItems = boq.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BOQItem[]>);

  const totalValue = boq.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  // Use business branding or defaults
  const primaryColor = business?.primary_color || '#f97316'; // Default orange
  const fontFamily = business?.font || 'Inter, system-ui, sans-serif';

  return (
    <div className="print-estimate-portal">
      <div className="print-container" style={{ fontFamily }}>
        <div className="max-w-4xl mx-auto">
          {/* Header with Logo */}
          <div style={{ 
            borderBottom: `3px solid ${primaryColor}`, 
            paddingBottom: '20px', 
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#111827', 
                margin: 0,
                fontFamily 
              }}>
                Bill of Quantities
              </h1>
              <div style={{ marginTop: '12px', color: '#4b5563' }}>
                <p style={{ fontWeight: '600', margin: '4px 0', fontSize: '16px' }}>{jobName}</p>
                {jobNumber && <p style={{ fontSize: '14px', margin: '4px 0' }}>Job #: {jobNumber}</p>}
                <p style={{ fontSize: '14px', margin: '4px 0', color: '#6b7280' }}>
                  Generated: {new Date().toLocaleDateString("en-AU", { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            {business?.logo_url && (
              <div style={{ flexShrink: 0 }}>
                <img 
                  src={business.logo_url} 
                  alt={business.name || 'Business logo'} 
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '200px', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
            )}
          </div>

          {/* Items by Category */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                backgroundColor: primaryColor,
                color: '#ffffff',
                padding: '10px 14px', 
                marginBottom: '0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily
              }}>
                {BOQ_CATEGORIES[category as keyof typeof BOQ_CATEGORIES]?.label || category}
              </h2>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', width: '80px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', width: '64px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Unit</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', width: '100px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Unit Price</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', width: '100px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: idx % 2 === 1 ? '#fafafa' : 'transparent'
                    }}>
                      <td style={{ padding: '10px 12px' }}>
                        {item.description}
                        {item.notes && (
                          <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.notes}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{item.unit}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                        {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: '500' }}>
                        {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* GST Breakdown */}
          <div style={{ 
            borderTop: `3px solid ${primaryColor}`, 
            paddingTop: '20px', 
            marginTop: '32px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ 
                backgroundColor: '#f9fafb',
                padding: '20px 28px',
                borderRadius: '8px',
                minWidth: '280px'
              }}>
                {/* Subtotal ex GST */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '14px', color: '#4b5563' }}>Subtotal (ex GST)</span>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>{formatCurrency(totalValue)}</span>
                </div>
                
                {/* GST 10% */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '14px', color: '#4b5563' }}>GST (10%)</span>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>{formatCurrency(totalValue * 0.10)}</span>
                </div>
                
                {/* Total inc GST */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total (inc GST)</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor }}>{formatCurrency(totalValue * 1.10)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {boq.notes && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</h3>
              <p style={{ fontSize: '14px', color: '#4b5563', whiteSpace: 'pre-wrap', margin: 0 }}>{boq.notes}</p>
            </div>
          )}

          {/* Footer with business name */}
          {business?.name && (
            <div style={{ 
              marginTop: '40px', 
              paddingTop: '16px', 
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                Prepared by {business.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
