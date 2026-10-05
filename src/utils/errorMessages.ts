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
