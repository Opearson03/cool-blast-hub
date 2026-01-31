# Memory: features/quotes/module-functionality-updates-v1
Updated: now

The 'concrete-pumping' module now uses the concrete volume with wastage applied (reading `wastage_percent` from the concrete-supply module answers, defaulting to 10%). This ensures pumping charges match the actual volume being pumped. Line items show the wastage-adjusted volume (e.g., "1.1 m³ incl. wastage"). The 'scopeData' object includes 'moduleAnswers' allowing any module to reference settings from other modules. Every estimator module also features an 'Add Item' button next to the 'Done' button for unlimited custom, module-specific line items.
