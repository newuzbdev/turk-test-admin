import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';
import axiosPrivate from '@/config/api';
import { useUpdateReadingPractice } from './update.queries';

vi.mock('@/config/api', () => ({ default: { patch: vi.fn() } }));

it('sends editable fields only and preserves the cover and question content', async () => {
  const patch = vi.mocked(axiosPrivate.patch).mockResolvedValue({ data: {} });
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children);
  const { result } = renderHook(useUpdateReadingPractice, { wrapper });
  await act(async () => { await result.current.mutateAsync({
    id: 'passage', title: 'Reading', coverImageUrl: 'https://example.com/cover.png',
    createdAt: 'old', updatedAt: 'old',
    questionGroups: [{ id: 'group', passageId: 'passage', type: 'MATCHING_HEADINGS', order: 1,
      title: 'Headings', questions: [{ id: 'question', groupId: 'group', order: 1, prompt: 'Title', answerKey: 'A', meta: { keywords: ['word'] } }] }],
  } as any); });
  expect(patch.mock.calls.at(-1)?.[1]).toEqual({
    title: 'Reading', coverImageUrl: 'https://example.com/cover.png',
    questionGroups: [{ type: 'MATCHING_HEADINGS', order: 1, title: 'Headings',
      questions: [{ order: 1, prompt: 'Title', answerKey: 'A', meta: { keywords: ['word'] } }] }],
  });
});

it('leaves pending state after a rejected save without automatically resubmitting', async () => {
  const patch = vi.mocked(axiosPrivate.patch).mockReset().mockRejectedValue({ response: { status: 400, data: { error: 'İstek işlenemedi.' } } });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 2, retryDelay: 1 } } });
  const wrapper = ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children);
  const { result } = renderHook(useUpdateReadingPractice, { wrapper });
  act(() => result.current.mutate({ id: 'passage', title: 'Reading' }));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.isPending).toBe(false);
  expect(patch).toHaveBeenCalledTimes(1);
});
