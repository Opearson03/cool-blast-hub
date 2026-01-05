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
    <div className="print-container print-only">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            background: white;
            padding: 40px;
          }
        }
        .print-only { display: none; }
        @media print { .print-only { display: block; } }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bill of Quantities</h1>
          <div className="mt-2 text-gray-600">
            <p className="font-medium">{jobName}</p>
            {jobNumber && <p className="text-sm">Job: {jobNumber}</p>}
            <p className="text-sm">Generated: {new Date().toLocaleDateString("en-AU")}</p>
          </div>
        </div>

        {/* Items by Category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-semibold bg-gray-100 px-3 py-2 mb-2">
              {BOQ_CATEGORIES[category as keyof typeof BOQ_CATEGORIES]?.label || category}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-right py-2 px-2 w-20">Qty</th>
                  <th className="text-left py-2 px-2 w-16">Unit</th>
                  <th className="text-right py-2 px-2 w-24">Unit Price</th>
                  <th className="text-right py-2 px-2 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      {item.description}
                      {item.notes && (
                        <span className="block text-xs text-gray-500">{item.notes}</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-2">{item.quantity}</td>
                    <td className="py-2 px-2">{item.unit}</td>
                    <td className="text-right py-2 px-2">
                      {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                    </td>
                    <td className="text-right py-2 px-2 font-medium">
                      {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Total */}
        <div className="border-t-2 border-gray-800 pt-4 mt-6">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {boq.notes && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{boq.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
