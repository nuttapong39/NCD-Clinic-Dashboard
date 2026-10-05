// src/services/ncdQueries.ts - barrel re-export
import * as ncdAppointmentQueries from './queries/ncdQueries'

export { NCD_CODES, NCD_COUNTED_OAPP_STATUS, NOT_ARRIVED_LIST_LIMIT } from './queries/ncdQueries'
export type { NcdCode } from './queries/ncdQueries'

export const ncdQueries = {
  ...ncdAppointmentQueries,
}
