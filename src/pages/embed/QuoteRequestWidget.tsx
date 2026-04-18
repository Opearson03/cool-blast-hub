import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Upload, FileImage, File as FileIcon, CheckCircle2, AlertCircle } from "lucide-react";

const MAX_BYTES = 20 * 1024 * 1024;

function isValidFile(file: File): boolean {
  return ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type) && file.size <= MAX_BYTES;
}

export default function QuoteRequestWidget() {
  const [searchParams] = useSearchParams();
  const business = searchParams.get('business') || '';
  const color = searchParams.get('color') || '#f97316';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ businessName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inject theme color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--widget-accent', color);
    document.body.style.background = 'transparent';
  }, [color]);

  const handleFileSelect = (selected: File | undefined) => {
    if (!selected) return;
    if (!isValidFile(selected)) {
      setError('Please upload a PDF, PNG, or JPG file under 20MB');
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const projectId = useMemo(() => {
    // Read project id from build env so we can call the function
    return (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please attach your building plans');
      return;
    }
    if (!business) {
      setError('Widget not configured — missing business identifier');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('business', business);
      fd.append('name', name);
      fd.append('email', email);
      fd.append('phone', phone);
      fd.append('site_address', siteAddress);
      fd.append('description', description);
      fd.append('plan', file);
      fd.append('website_url', honeypot); // honeypot

      const url = `https://${projectId}.supabase.co/functions/v1/submit-public-quote-request`;
      const res = await fetch(url, {
        method: 'POST',
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Submission failed');
      }

      setSuccess({ businessName: json.business_name });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <CheckCircle2 size={56} color={color} style={{ margin: '0 auto 16px' }} />
            <h2 style={{ ...styles.h2, marginBottom: 8 }}>Plans received!</h2>
            <p style={{ ...styles.muted, marginBottom: 24 }}>
              {success.businessName ? `${success.businessName} will` : 'We will'} review your plans and be in touch shortly.
            </p>
            <div style={styles.footer}>Powered by <a href="https://pourhub.com.au" target="_blank" rel="noopener noreferrer" style={{ color, textDecoration: 'none', fontWeight: 600 }}>PourHub</a></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.h2}>Request a Quote</h2>
        <p style={styles.muted}>Share your project details and upload plans — we'll get back to you with a quote.</p>

        <div style={styles.field}>
          <label style={styles.label}>Your name *</label>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Email *</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Phone</label>
            <input style={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Site address *</label>
          <input style={styles.input} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} required maxLength={300} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Project description</label>
          <textarea style={{ ...styles.input, minHeight: 80, fontFamily: 'inherit' }} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Tell us about your project (optional)" />
        </div>

        {/* Honeypot - hidden from users */}
        <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
          <label>Website (leave blank)</label>
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Building plans *</label>
          <div
            style={{ ...styles.drop, borderColor: file ? color : '#d4d4d8' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                {file.type === 'application/pdf' ? <FileIcon size={20} color={color} /> : <FileImage size={20} color={color} />}
                <span style={{ fontSize: 14 }}>{file.name}</span>
                <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Remove</button>
              </div>
            ) : (
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <Upload size={28} color="#71717a" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop file here or click to upload</div>
                <div style={{ fontSize: 12, color: '#71717a' }}>PDF, PNG, JPG · Max 20MB</div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 8, padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 6, fontSize: 13, alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{ ...styles.submit, background: color, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="spin" />
              Submitting…
            </span>
          ) : 'Send Quote Request'}
        </button>

        <div style={styles.footer}>
          Powered by <a href="https://pourhub.com.au" target="_blank" rel="noopener noreferrer" style={{ color, textDecoration: 'none', fontWeight: 600 }}>PourHub</a>
        </div>

        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#18181b',
    background: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  card: {
    background: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    position: 'relative',
  },
  h2: { fontSize: 20, fontWeight: 700, margin: 0 },
  muted: { fontSize: 13, color: '#71717a', margin: 0, marginBottom: 4 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' as any },
  label: { fontSize: 13, fontWeight: 500 },
  input: {
    padding: '9px 12px',
    border: '1px solid #d4d4d8',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as any,
    background: '#fff',
    color: '#18181b',
  },
  drop: {
    border: '2px dashed #d4d4d8',
    borderRadius: 8,
    padding: 24,
    textAlign: 'center' as any,
    transition: 'border-color 0.15s',
  },
  submit: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  footer: { fontSize: 11, color: '#a1a1aa', textAlign: 'center' as any, marginTop: 8 },
};
