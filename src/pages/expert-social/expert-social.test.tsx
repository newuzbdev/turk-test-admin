import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
const query = vi.hoisted(() => ({data:undefined as unknown,isPending:false,isError:false,isFetching:false,refetch:vi.fn()}));
const useSummary=vi.hoisted(()=>vi.fn(()=>query));
vi.mock('@/config/queries/expert-social',()=>({useExpertSocialSummary:useSummary}));
import ExpertSocial from './expert-social';
const nativeComputedStyle=window.getComputedStyle.bind(window);
beforeEach(()=>{vi.spyOn(window,'getComputedStyle').mockImplementation(element=>nativeComputedStyle(element));});
afterEach(()=>{cleanup();query.data=undefined;query.isError=false;query.isPending=false;vi.clearAllMocks();vi.restoreAllMocks();});
const data={total:12,items:[{expertId:'hakan',name:'Hakan Birdal',telegram:7,instagram:3,total:10},{expertId:'muattar',name:'Muattar Mamatkarimova',telegram:0,instagram:null,total:0},{expertId:'timur',name:'Timur Makarov',telegram:0,instagram:2,total:2}]};
it('shows per-expert and per-platform clicks and changes the requested date period',()=>{
 query.data=data;render(<ExpertSocial/>);
 expect(screen.getByRole('heading',{name:'Uzman bağlantıları'})).toBeInTheDocument();
 expect(screen.getByText('Hakan Birdal')).toBeInTheDocument();
 expect(screen.getByText('12 tıklama')).toBeInTheDocument();
 expect(screen.getByText('—')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Tarih aralığı'),{target:{value:'today'}});
 expect(useSummary).toHaveBeenLastCalledWith('today');
 fireEvent.click(screen.getByRole('button',{name:'Yenile'}));expect(query.refetch).toHaveBeenCalledOnce();
});
it('distinguishes no recorded clicks from an unavailable statistics endpoint',()=>{
 query.data={...data,total:0,items:data.items.map(row=>({...row,telegram:0,instagram:row.instagram===null?null:0,total:0}))};
 const view=render(<ExpertSocial/>);
 expect(screen.getByText('Henüz kaydedilmiş tıklama yok.')).toBeInTheDocument();
 query.isError=true;view.rerender(<ExpertSocial/>);
 expect(screen.getByText('İstatistikler alınamadı.')).toBeInTheDocument();
 expect(screen.queryByText('0 tıklama')).not.toBeInTheDocument();
 expect(screen.queryByText('Henüz kaydedilmiş tıklama yok.')).not.toBeInTheDocument();
});
