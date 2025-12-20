# Routes Refactoring - Progress Update

**Date:** January 2025  
**Status:** In Progress - 127+ Duplicate Blocks Identified

---

## Latest Progress

### Duplicate Routes Commented Out This Session:
1. ✅ Global search route → Already in `patients.ts`
2. ✅ Medicine search route → Already in `medicines.ts` and `prescriptions.ts`
3. ✅ Lab tests search route → Already in `laboratory.ts`
4. ✅ Diagnoses search route → Needs to be moved to appropriate module
5. ✅ Symptoms search route → Needs to be moved to appropriate module
6. ✅ Pharmacies search route → Already in `suggestions.ts`

### Current Statistics:
- **Total Duplicate Blocks:** 127+ (up from 121+)
- **File Size:** ~16,074 lines
- **Routes Migrated:** 13 routes
- **New Modular Files:** 1 (`print.ts`)
- **Enhanced Modular Files:** 3 (`patient-extended.ts`, `prescriptions.ts`, `patients.ts`)
- **Progress:** ~39% of file commented out

---

## Routes Still Needing Attention

### High Priority (Unique Routes - Need Migration):
1. **Procedural Reports Routes** (3 routes)
   - `GET /api/procedural-reports`
   - `POST /api/procedural-reports`
   - `GET /api/procedural-reports/:id`
   - **Action:** Move to `patient-extended.ts` or create `procedural-reports.ts`

2. **Consent Forms Routes** (2 routes)
   - `GET /api/consent-forms`
   - `POST /api/consent-forms`
   - **Action:** Move to `patient-extended.ts` or create `consent.ts`

3. **Patient Consents Routes** (3 routes)
   - `GET /api/patient-consents`
   - `POST /api/patient-consents`
   - `GET /api/patients/:patientId/consents`
   - **Action:** Move to `patient-extended.ts` or create `consent.ts`

4. **Patient Referral Routes** (4 routes)
   - `GET /api/patients/:id/referrals`
   - `POST /api/patients/:id/referrals`
   - `PATCH /api/patients/:id/referrals/:referralId`
   - `DELETE /api/patients/:id/referrals/:referralId`
   - **Note:** These use different paths than `/api/referrals` in `referrals.ts` - may be unique or need consolidation

5. **Availability Slots Routes** (2 routes)
   - `GET /api/availability-slots`
   - `POST /api/availability-slots`
   - **Action:** Check if in `appointments.ts`, if not, move there

6. **Blackout Dates Routes** (2 routes)
   - `GET /api/blackout-dates`
   - `POST /api/blackout-dates`
   - **Action:** Check if in `appointments.ts`, if not, move there

### Medium Priority (Search Routes - Need Module):
1. **Diagnoses Search Route**
   - `GET /api/diagnoses/search`
   - **Action:** Move to `suggestions.ts` or create search module

2. **Symptoms Search Route**
   - `GET /api/symptoms/search`
   - **Action:** Move to `suggestions.ts` or create search module

### Low Priority (System Routes):
1. **Superadmin Routes** - Check if handled by `super-admin-routes.ts`
2. **Audit Logs Routes** - Check if handled by existing module
3. **User Management Routes** - Check if handled by `users.ts`

---

## Files Modified This Session

1. ✅ `server/routes.ts` - Commented out 6 additional duplicate search routes

---

## Next Steps

1. **Move Procedural Reports** → `patient-extended.ts` or new module
2. **Move Consent Routes** → `patient-extended.ts` or new `consent.ts` module
3. **Check Patient Referral Routes** → Consolidate with `referrals.ts` or keep separate
4. **Move Availability/Blackout Routes** → `appointments.ts`
5. **Move Search Routes** → `suggestions.ts` or create search module
6. **Continue Identifying Duplicates**

---

## Success Criteria

✅ 127+ duplicate blocks identified  
✅ 6 additional duplicate routes commented out  
✅ Search routes identified for migration  
✅ Unique routes identified for migration  
✅ No syntax errors  

---

**Last Updated:** January 2025  
**Status:** ✅ Progressing Well

