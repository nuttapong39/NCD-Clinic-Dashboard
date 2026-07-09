// src/services/pregnancyQueries.ts - barrel re-export
import * as ancQueries from './queries/ancQueries'
import * as deliveryQueries from './queries/deliveryQueries'
import * as neonatalQueries from './queries/neonatalQueries'

export const pregnancyQueries = {
  ...ancQueries,
  ...deliveryQueries,
  ...neonatalQueries,
}
