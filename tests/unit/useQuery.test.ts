// =============================================================================
// useQuery hook tests
// Tests async query lifecycle: idle, loading, success, error, reset, unmount
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useQuery } from '@/hooks/useQuery'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryFn<T>(result: T) {
  return vi.fn().mockResolvedValue(result)
}

function makeFailingQueryFn(message = 'Query failed') {
  return vi.fn().mockRejectedValue(new Error(message))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('MUST return idle state initially when not enabled', () => {
    const queryFn = makeQueryFn([{ id: 1 }])

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: false })
    )

    expect(result.current.state).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.executionTimeMs).toBeNull()
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('MUST execute query and return data when enabled is true', async () => {
    const data = [{ id: 1, name: 'Test' }]
    const queryFn = makeQueryFn(data)

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(data)
    expect(result.current.error).toBeNull()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('MUST set isLoading to true while query is executing', async () => {
    let resolveQuery!: (value: string[]) => void
    const queryFn = vi.fn(
      () => new Promise<string[]>((resolve) => { resolveQuery = resolve })
    )

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    // Should be loading before resolve
    await waitFor(() => expect(result.current.isLoading).toBe(true))
    expect(result.current.state).toBe('loading')

    // Resolve and confirm transition
    await act(async () => { resolveQuery(['done']) })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })

  it('MUST set isError and error when query throws', async () => {
    const queryFn = makeFailingQueryFn('Something went wrong')

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.state).toBe('error')
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Something went wrong')
    expect(result.current.data).toBeNull()
  })

  it('MUST set isSuccess when query completes successfully', async () => {
    const queryFn = makeQueryFn({ count: 42 })

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.state).toBe('success')
    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('MUST return executionTimeMs after successful query', async () => {
    const queryFn = makeQueryFn({ rows: [] })

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.executionTimeMs).not.toBeNull()
    expect(typeof result.current.executionTimeMs).toBe('number')
    expect(result.current.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('MUST return executionTimeMs after failed query', async () => {
    const queryFn = makeFailingQueryFn('oops')

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.executionTimeMs).not.toBeNull()
    expect(typeof result.current.executionTimeMs).toBe('number')
  })

  it('MUST re-execute when execute() is called manually', async () => {
    const queryFn = makeQueryFn([1, 2, 3])

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: false })
    )

    expect(queryFn).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.execute()
    })

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual([1, 2, 3])

    // Call again to verify re-execution
    await act(async () => {
      await result.current.execute()
    })

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('MUST reset state when reset() is called', async () => {
    const queryFn = makeQueryFn({ value: 99 })

    const { result } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Confirm data was set
    expect(result.current.data).toEqual({ value: 99 })

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.executionTimeMs).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('MUST not update state after unmount', async () => {
    let resolveQuery!: (value: string) => void
    const queryFn = vi.fn(
      () => new Promise<string>((resolve) => { resolveQuery = resolve })
    )

    const { result, unmount } = renderHook(() =>
      useQuery({ queryFn, enabled: true })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(true))

    // Unmount while query is in-flight
    unmount()

    // Resolve after unmount — should not throw or update
    await act(async () => { resolveQuery('late result') })

    // State should remain as it was at unmount time (loading/idle), not 'success'
    expect(result.current.state).not.toBe('success')
  })

  it('MUST call onSuccess callback when query completes successfully', async () => {
    const data = { rows: [1, 2] }
    const queryFn = makeQueryFn(data)
    const onSuccess = vi.fn()

    renderHook(() =>
      useQuery({ queryFn, enabled: true, onSuccess })
    )

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(onSuccess).toHaveBeenCalledWith(data)
  })

  it('MUST call onError callback when query throws', async () => {
    const queryFn = makeFailingQueryFn('boom')
    const onError = vi.fn()

    renderHook(() =>
      useQuery({ queryFn, enabled: true, onError })
    )

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(onError.mock.calls[0][0].message).toBe('boom')
  })
})
