

# Inbox Tab Enhancement Plan

## Overview

This plan addresses three key improvements to the Inbox functionality:
1. Make emails clickable to view full details in a side sheet
2. Add in-app document/attachment viewer instead of opening in a new tab
3. Rename "Inbox History" to "Inbox" and make it the default (first) tab

## Current State

- `InboxHistoryTab.tsx` displays a list of inbox items with basic metadata (subject, from, date)
- Clicking "View" opens attachments in a new browser tab using signed URLs
- Tab order: Clients | Sub-Contractors | Suppliers | Inbox History
- Default tab on page load is "clients"
- No email body content is stored in the database (only subject, from_email, from_name, file metadata)
- The project has an existing PDF viewer component (`PlanViewer.tsx`) using pdf.js

## Proposed Changes

### 1. Tab Reordering & Renaming

| Change | Before | After |
|--------|--------|-------|
| Default tab | `clients` | `inbox` |
| Tab order | Clients, Sub-Contractors, Suppliers, Inbox History | **Inbox**, Clients, Sub-Contractors, Suppliers |
| Tab label | "Inbox History" | "Inbox" |

### 2. Clickable Email Cards with Detail Sheet

When a user clicks on an email row, a detail sheet will slide in from the right showing:

```text
+----------------------------------+
| [X]                              |
| Subject: RE: Site Plans for 123  |
| From: john@example.com           |
| Date: 02 Feb 2026 at 9:30 AM     |
+----------------------------------+
| Type: Plan       Status: Pending |
+----------------------------------+
|                                  |
| [Attachment Viewer Area]         |
| ┌──────────────────────────────┐ |
| │                              │ |
| │    PDF / Image Preview       │ |
| │                              │ |
| └──────────────────────────────┘ |
|                                  |
| Filename: building_plans.pdf     |
| [Open in New Tab]                |
|                                  |
+----------------------------------+
| [Go to Quote] (if linked)        |
+----------------------------------+
```

### 3. In-App Document Viewer

The attachment viewer will support:
- **PDFs**: Rendered using pdf.js (reusing pattern from `PlanViewer.tsx`)
- **Images**: Displayed directly in an `<img>` tag
- Page navigation for multi-page PDFs
- Fallback "Open in New Tab" button for unsupported formats

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/contacts/InboxDetailSheet.tsx` | **Create** | New component for viewing email/attachment details |
| `src/components/contacts/InboxHistoryTab.tsx` | **Modify** | Rename to InboxTab, make cards clickable, integrate detail sheet |
| `src/pages/admin/AdminContacts.tsx` | **Modify** | Reorder tabs, change default to "inbox", rename label |

### InboxDetailSheet Component Design

```typescript
interface InboxDetailSheetProps {
  item: InboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToLinked: (item: InboxItem) => void;
}
```

**Key Features:**
1. **Header Section**: Subject, from email/name, received date, type badge, status badge
2. **Document Viewer**: 
   - Uses signed URL from Supabase storage
   - For PDFs: Canvas-based rendering with page navigation
   - For images (jpg, png, webp, gif): Direct `<img>` display
   - Loading state while fetching signed URL and rendering
3. **File Info**: Filename, file size (if available)
4. **Actions**: 
   - "Open in New Tab" button (for fallback/preference)
   - "Go to Quote/Job" button (if linked)

### Implementation Details

**Document Type Detection:**
```typescript
const getFileType = (fileName: string): 'pdf' | 'image' | 'other' => {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  return 'other';
};
```

**PDF Viewer (simplified from PlanViewer):**
- Uses pdfjs-dist library already in dependencies
- Single-page display with page navigation
- No drawing/markup overlays needed (read-only viewer)
- Sized to fit within the sheet container

**Signed URL Handling:**
- Fetch signed URL when sheet opens
- Cache URL during sheet session
- Show loading spinner while URL is being generated

### Mobile Considerations

- Sheet will be full-screen on mobile (`sm:max-w-xl`)
- Document viewer scales responsively
- Touch-friendly page navigation buttons
- Pinch-to-zoom for PDF/images (leverage existing pattern)

### Edge Cases

1. **Unsupported file types**: Show file name with "Open in New Tab" only
2. **Failed to load**: Show error message with retry option
3. **Large PDFs**: Show first page with page count, allow navigation
4. **Missing attachment**: Display "(No attachment)" message

