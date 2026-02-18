
## Remove Phone Field from Waitlist Form

### Why It's Slow

The form currently makes up to 3 sequential network calls before showing success:
1. `get_referrer_by_code` (if referral code present)
2. `join_waitlist` RPC
3. `send-waitlist-welcome` edge function (awaited)
4. `notify-referral-success` edge function (awaited, if referred)

Calls 3 and 4 are the likely culprits — they're awaited sequentially, meaning the user stares at a spinner while emails are being sent. The phone field itself isn't causing the slowness, but removing it is still the right call if it's reducing conversions.

The plan also fixes the email calls to run in the background (fire-and-forget) so the form resolves as soon as the DB insert succeeds — much faster.

---

### Changes to `src/components/waitlist/WaitlistForm.tsx`

1. **Remove** the `phone` state variable (`const [phone, setPhone] = useState("")`)
2. **Remove** `_phone: phone.trim() || null` from the `join_waitlist` RPC call
3. **Remove** the Mobile Number input field from the form JSX
4. **Make the email functions non-blocking** — wrap the `send-waitlist-welcome` and `notify-referral-success` calls in `.then().catch()` instead of `await`, so they run in the background after the user has already seen the success screen

---

### No Database Changes Needed

The `phone` column stays in the `waiting_list` table and the `join_waitlist` RPC still accepts `_phone` as an optional parameter — we're just not passing it. This means:
- Existing data is untouched
- Staff can still see the Phone column in the dashboard (it will be empty for new signups)
- If you ever want to add the field back, it's a one-line frontend change

---

### Files to Change

| File | Change |
|---|---|
| `src/components/waitlist/WaitlistForm.tsx` | Remove phone state + input field + `_phone` RPC arg; make email sends non-blocking |
