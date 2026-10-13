import { expect, it } from 'vitest';
import { RegistrationTracker } from './student-registration-tracker';
const row=(id:string,createdAt='2026-10-13T05:00:00Z')=>({id,name:id,createdAt});
it('first page establishes a baseline; later arrivals notify once, ties remain deterministic',()=>{
 const tracker=new RegistrationTracker();
 expect(tracker.observe([row('a')])).toEqual([]);
 expect(tracker.observe([row('c'),row('b'),row('a')]).map(r=>r.id)).toEqual(['c','b']);
 expect(tracker.observe([row('c'),row('b'),row('a')])).toEqual([]);
 expect(tracker.observe([row('old','2026-10-12T05:00:00Z')])).toEqual([]);
 expect(tracker.observe([row('d','2026-10-13T05:01:00Z')]).map(r=>r.id)).toEqual(['d']);
});
it('invalid rows cannot poison the watermark',()=>{
 const tracker=new RegistrationTracker();tracker.observe([row('a')]);
 expect(tracker.observe([row('bad','invalid')])).toEqual([]);
 expect(tracker.observe([row('b')]).map(r=>r.id)).toEqual(['b']);
});
