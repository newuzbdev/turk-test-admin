import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Notices,{NewStudentNoticeToggle} from './student-registration-notices';
const mock=vi.hoisted(()=>({id:'admin-a',request:vi.fn(),rows:[{id:'a',name:'Ada',createdAt:'2026-10-13T05:00:00Z'}]}));
vi.mock('@/config/queries/access',()=>({useAccessConfig:()=>({data:{enabled:true}})}));
vi.mock('./student-subscription-query',()=>({useSubscriptionAdminId:()=>mock.id,adminAccountRequest:(...args:unknown[])=>mock.request(...args)}));
vi.mock('./student-live-query',()=>({currentAdminId:()=>mock.id,useDocumentVisible:()=>true}));
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();mock.id='admin-a';mock.rows=[{id:'a',name:'Ada',createdAt:'2026-10-13T05:00:00Z'}];mock.request.mockReset().mockImplementation(async()=>({success:true,data:{items:mock.rows}}));});
afterEach(()=>{cleanup();vi.useRealTimers();localStorage.clear();});
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
function mount(){return render(<MemoryRouter><NewStudentNoticeToggle/><Notices/></MemoryRouter>);}
it('new arrivals are small dismissible alerts, toggle suppresses polling and re-enable does not replay old students',async()=>{
 mount();await flush();expect(screen.queryByRole('status')).not.toBeInTheDocument();
 mock.rows=[{id:'b',name:'Bora',createdAt:'2026-10-13T05:01:00Z'},...mock.rows];
 await act(async()=>vi.advanceTimersByTimeAsync(20000));expect(screen.getByRole('status')).toHaveTextContent('Bora katıldı');
 fireEvent.click(screen.getByRole('switch',{name:'Yeni kayıt bildirimleri'}));expect(screen.queryByRole('status')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('switch',{name:'Yeni kayıt bildirimleri'}));await flush();expect(screen.queryByRole('status')).not.toBeInTheDocument();
 mock.rows=[{id:'c',name:'Ceren',createdAt:'2026-10-13T05:02:00Z'},...mock.rows];
 await act(async()=>vi.advanceTimersByTimeAsync(20000));expect(screen.getByRole('status')).toHaveTextContent('Ceren katıldı');

 fireEvent.click(screen.getByLabelText('Yeni kayıt bildirimini kapat'));await act(async()=>vi.advanceTimersByTimeAsync(20000));expect(screen.queryByRole('status')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('switch',{name:'Yeni kayıt bildirimleri'}));const calls=mock.request.mock.calls.length;await act(async()=>vi.advanceTimersByTimeAsync(40000));expect(mock.request).toHaveBeenCalledTimes(calls);
 expect(localStorage.getItem('admin-registration-notices:admin-a')).toBe('off');
 fireEvent.click(screen.getByRole('switch',{name:'Yeni kayıt bildirimleri'}));await flush();expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
it('late requests from a replaced administrator are aborted and cannot show names',async()=>{
 let resolve:(value:unknown)=>void=()=>{};
 mock.request.mockImplementation(()=>new Promise(r=>{resolve=r;}));const view=mount();const signal=mock.request.mock.calls[0][4] as AbortSignal;
 mock.id='admin-b';view.rerender(<MemoryRouter><NewStudentNoticeToggle/><Notices/></MemoryRouter>);expect(signal.aborted).toBe(true);
 await act(async()=>resolve({success:true,data:{items:[{id:'private',name:'Old admin data',createdAt:'2026-10-13T06:00:00Z'}]}}));expect(screen.queryByText('Old admin data')).not.toBeInTheDocument();
});
