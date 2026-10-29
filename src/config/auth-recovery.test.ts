import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import client from './api';
import { api } from '.';
const reply = (config: InternalAxiosRequestConfig, data: unknown) => ({config,data,status:200,statusText:'OK',headers:{}});
const fail = (config: InternalAxiosRequestConfig, status: number) => new AxiosError('Fixture','ERR_BAD_RESPONSE',config,undefined,{config,status,statusText:'Failure',headers:{},data:{}});
let redirects: string[];
beforeEach(() => {
  localStorage.clear();localStorage.setItem('accessToken','old');localStorage.setItem('refreshToken','refresh');
  localStorage.setItem('editor-draft','Keep me');redirects=[];
  vi.stubGlobal('window',{location:{pathname:'/students',search:'?tab=live',hash:'',set href(value:string){redirects.push(value);}}});
  client.defaults.adapter=async config=>{if(config.headers.Authorization==='Bearer renewed')return reply(config,{ok:true});throw fail(config,401);};
  api.defaults.adapter=async config=>reply(config,{accessToken:'renewed'});
});
afterEach(()=>vi.unstubAllGlobals());
describe('admin session recovery',()=>{
  for(const status of [null,503]) it(`retains session on ${status??'network'} refresh failure, then recovers`,async()=>{
    api.defaults.adapter=async config=>{throw status?fail(config,status):new AxiosError('Network Error','ERR_NETWORK',config);};
    await expect(client.get('/api/admin/me')).rejects.toBeDefined();
    expect(localStorage.getItem('refreshToken')).toBe('refresh');expect(redirects).toEqual([]);
    api.defaults.adapter=async config=>reply(config,{accessToken:'renewed'});
    expect((await client.get('/api/admin/me')).data).toEqual({ok:true});
  });
  it('shares renewal across concurrent requests with a finite timeout',async()=>{
    let resolve!:()=>void;const pending=new Promise<void>(r=>{resolve=r;});let calls=0;let timeout=0;
    api.defaults.adapter=async config=>{calls++;timeout=config.timeout??0;await pending;return reply(config,{accessToken:'renewed'});};
    const requests=Promise.all([client.get('/api/admin/me'),client.get('/api/admin/students')]);
    await new Promise(r=>setTimeout(r,0));resolve();await requests;expect(calls).toBe(1);expect(timeout).toBeGreaterThan(0);
  });
  it('expired refresh clears only auth and returns to login',async()=>{
    api.defaults.adapter=async config=>{throw fail(config,401);};
    await expect(client.get('/api/admin/me')).rejects.toBeDefined();
    expect(localStorage.getItem('accessToken')).toBeNull();expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('editor-draft')).toBe('Keep me');expect(redirects).toHaveLength(1);
  });
  it('rejection of renewed access cannot leave a stale session or loop',async()=>{
    let calls=0;api.defaults.adapter=async config=>{calls++;return reply(config,{accessToken:'renewed'});};
    client.defaults.adapter=async config=>{throw fail(config,401);};
    await expect(client.get('/api/admin/me')).rejects.toBeDefined();
    expect(calls).toBe(1);expect(localStorage.getItem('accessToken')).toBeNull();expect(redirects).toHaveLength(1);
  });
  for(const rejected of [false,true]) it(`late refresh ${rejected?'failure':'success'} cannot change a newer login`,async()=>{
    let resolve!:()=>void;const pending=new Promise<void>(r=>{resolve=r;});
    api.defaults.adapter=async config=>{await pending;if(rejected)throw fail(config,401);return reply(config,{accessToken:'renewed'});};
    const request=client.get('/api/admin/me');const rejection=expect(request).rejects.toBeDefined();
    await new Promise(r=>setTimeout(r,0));localStorage.setItem('refreshToken','new-login-refresh');localStorage.setItem('accessToken','new-login');resolve();await rejection;
    expect(localStorage.getItem('accessToken')).toBe('new-login');expect(redirects).toEqual([]);
  });
  it('missing token in renewal reply preserves login as an unconfirmed server failure',async()=>{
    api.defaults.adapter=async config=>reply(config,{});
    await expect(client.get('/api/admin/me')).rejects.toMatchObject({message:expect.stringMatching(/yanıtı/)});
    expect(localStorage.getItem('refreshToken')).toBe('refresh');expect(redirects).toEqual([]);
  });
});
