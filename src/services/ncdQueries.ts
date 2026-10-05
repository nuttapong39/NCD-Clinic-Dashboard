// src/services/ncdQueries.ts - barrel re-export
import * as ncdAppointmentQueries from './queries/ncdQueries'

export { NCD_CODES } from './queries/ncdQueries'
export type { NcdCode } from './queries/ncdQueries'

export const ncdQueries = {
  ...ncdAppointmentQueries,
}
