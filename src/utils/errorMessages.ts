// =============================================================================
// Technical error → actionable Thai message (UI-TEMPLATE §7.11)
// =============================================================================

const GENERIC_MESSAGE = 'ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
const THAI_CHARACTERS = /[฀-๿]/

export function toFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (/unauthorized|expired/i.test(message)) return 'เซสชันหมดอายุ กรุณาเชื่อมต่อใหม่แล้วลองอีกครั้ง'
  if (/timed out/i.test(message)) return 'คำขอนานเกินไป กรุณาลองใหม่อีกครั้ง'
  if (/unable to connect/i.test(message)) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่'
  if (THAI_CHARACTERS.test(message)) return message
  return GENERIC_MESSAGE
}

/** Session-connection error → actionable Thai message for the login and expired screens. */
export function toFriendlySessionError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (/timed out/i.test(message)) return 'เชื่อมต่อบริการเซสชันนานเกินไป กรุณาลองใหม่อีกครั้ง'
  if (/unable to connect/i.test(message)) return 'เชื่อมต่อบริการเซสชันไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
  if (/expired|not found|failed to retrieve session|unauthorized/i.test(message)) {
    return 'รหัสเซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเปิดแดชบอร์ดจากเมนูใน HOSxP อีกครั้ง หรือป้อนรหัสเซสชันใหม่'
  }
  if (THAI_CHARACTERS.test(message)) return message
  return 'เชื่อมต่อเซสชันไม่สำเร็จ กรุณาตรวจสอบรหัสเซสชันแล้วลองใหม่'
}
