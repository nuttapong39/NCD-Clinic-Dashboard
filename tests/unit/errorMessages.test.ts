import { describe, it, expect } from 'vitest'
import { toFriendlyError, toFriendlySessionError } from '@/utils/errorMessages'

describe('toFriendlyError', () => {
  it('MUST ask the user to reconnect when the session is unauthorized or expired', () => {
    expect(toFriendlyError(new Error('Session unauthorized. Please reconnect.'))).toBe(
      'เซสชันหมดอายุ กรุณาเชื่อมต่อใหม่แล้วลองอีกครั้ง',
    )
    expect(toFriendlyError(new Error('Session has expired. Please reconnect.'))).toBe(
      'เซสชันหมดอายุ กรุณาเชื่อมต่อใหม่แล้วลองอีกครั้ง',
    )
  })

  it('MUST explain timeouts', () => {
    expect(toFriendlyError(new Error('Query timed out after 60 seconds.'))).toBe(
      'คำขอนานเกินไป กรุณาลองใหม่อีกครั้ง',
    )
  })

  it('MUST explain network failures', () => {
    expect(toFriendlyError(new Error('Unable to connect to the BMS API.'))).toBe(
      'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่',
    )
  })

  it('MUST pass through messages that are already in Thai', () => {
    expect(toFriendlyError(new Error('มีการร้องขอบ่อยเกินไป (HTTP 429)'))).toBe('มีการร้องขอบ่อยเกินไป (HTTP 429)')
  })

  it('MUST fall back to a generic retry message for unknown technical errors', () => {
    expect(toFriendlyError(new Error('TypeError: x is undefined'))).toBe(
      'ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    )
    expect(toFriendlyError(null)).toBe('ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  })
})

describe('toFriendlySessionError', () => {
  it('MUST explain an expired or unknown session and how to get a new one', () => {
    const expected = 'รหัสเซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเปิดแดชบอร์ดจากเมนูใน HOSxP อีกครั้ง หรือป้อนรหัสเซสชันใหม่'
    expect(toFriendlySessionError(new Error('Session has expired. Please enter a new session ID.'))).toBe(expected)
    expect(toFriendlySessionError(new Error('Session retrieval failed: Session expired or not found'))).toBe(expected)
    expect(toFriendlySessionError(new Error('Failed to retrieve session (HTTP 404). Please verify your session ID and try again.'))).toBe(expected)
  })

  it('MUST explain network failures and timeouts while connecting', () => {
    expect(toFriendlySessionError(new Error('Unable to connect to the session service.'))).toBe(
      'เชื่อมต่อบริการเซสชันไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
    )
    expect(toFriendlySessionError(new Error('Session retrieval timed out after 30 seconds.'))).toBe(
      'เชื่อมต่อบริการเซสชันนานเกินไป กรุณาลองใหม่อีกครั้ง',
    )
  })

  it('MUST pass through messages that are already in Thai', () => {
    expect(toFriendlySessionError(new Error('มีการร้องขอบ่อยเกินไป (HTTP 429)'))).toBe('มีการร้องขอบ่อยเกินไป (HTTP 429)')
  })

  it('MUST fall back to a generic connection message for unknown errors', () => {
    expect(toFriendlySessionError(new Error('Invalid session ID'))).toBe(
      'เชื่อมต่อเซสชันไม่สำเร็จ กรุณาตรวจสอบรหัสเซสชันแล้วลองใหม่',
    )
  })
})
