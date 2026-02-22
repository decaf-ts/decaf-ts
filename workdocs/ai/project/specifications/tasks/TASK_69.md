# TASK_69: Update RamAdapter to use lock from config, no internal creation

**Task ID:** TASK_69  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 3 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Req-7, Req-10)

## Description
Update RamAdapter to use lock instance passed via configuration instead of creating locks internally.

## Requirements (from DECAF_7)
- Lock MUST be passed via adapter config, NOT created internally
- RamAdapter requires transaction management via lock reference counting
- beginTransaction/endTransaction are no-ops for in-memory adapter
- Lock instance is provided in constructor config

## Deliverables
- [ ] Updated RamAdapter constructor to accept lock via config
- [ ] RamConfig updated to include lock parameter
- [ ] beginTransaction() and endTransaction() implementations (no-ops)
- [ ] No internal lock creation in RamAdapter
- [ ] Proper constructor signature: `new RamAdapter({ lock: new MultiLock(...) })`

## Dependencies
- None

## Blocked By
- None

## Notes
- See DECAF_7 Section 4.3 (RamAdapter Implementation) for required code
- Lock instance created by consumers and passed via config
- No internal creation - lock always comes from config
