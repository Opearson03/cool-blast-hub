import { BOQItem, BOQ_CATEGORIES, JobBOQ } from "./BOQTypes";

interface PrintableBOQProps {
  boq: JobBOQ;
  jobName: string;
  jobNumber?: string;
}

export function PrintableBOQ({ boq, jobName, jobNumber }: PrintableBOQProps) {
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

  return (
    <div className="print-estimate-portal">
      <div className="print-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div style={{ borderBottom: '2px solid #1f2937', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Bill of Quantities</h1>
            <div style={{ marginTop: '8px', color: '#4b5563' }}>
              <p style={{ fontWeight: '500', margin: '4px 0' }}>{jobName}</p>
              {jobNumber && <p style={{ fontSize: '14px', margin: '4px 0' }}>Job: {jobNumber}</p>}
              <p style={{ fontSize: '14px', margin: '4px 0' }}>Generated: {new Date().toLocaleDateString("en-AU")}</p>
            </div>
          </div>

          {/* Items by Category */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                backgroundColor: '#f3f4f6', 
                padding: '8px 12px', 
                marginBottom: '8px' 
              }}>
                {BOQ_CATEGORIES[category as keyof typeof BOQ_CATEGORIES]?.label || category}
              </h2>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '8px', width: '80px', fontWeight: '600' }}>Qty</th>
                    <th style={{ textAlign: 'left', padding: '8px', width: '64px', fontWeight: '600' }}>Unit</th>
                    <th style={{ textAlign: 'right', padding: '8px', width: '96px', fontWeight: '600' }}>Unit Price</th>
                    <th style={{ textAlign: 'right', padding: '8px', width: '96px', fontWeight: '600' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>
                        {item.description}
                        {item.notes && (
                          <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>{item.notes}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{item.quantity}</td>
                      <td style={{ padding: '8px' }}>{item.unit}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>
                        {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px', fontWeight: '500' }}>
                        {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Total */}
          <div style={{ borderTop: '2px solid #1f2937', paddingTop: '16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 4px 0' }}>Total Value</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {boq.notes && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Notes</h3>
              <p style={{ fontSize: '14px', color: '#4b5563', whiteSpace: 'pre-wrap', margin: 0 }}>{boq.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
