import { describe, it, expect } from 'vitest'
import { toFriendlyError } from '@/utils/errorMessages'

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
