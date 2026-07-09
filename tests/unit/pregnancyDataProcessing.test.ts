// tests/unit/pregnancyDataProcessing.test.ts
import { describe, it, expect } from 'vitest'
import { processDeliveryTypes, sortAndCalculatePercentages } from '@/services/pregnancyDataProcessing'

describe('processDeliveryTypes', () => {
  it('MUST calculate C-section rate correctly', () => {
    const rawData = [
      { person_labour_type_name: 'C-Section', count: 25 },
      { person_labour_type_name: 'Normal', count: 75 },
    ]
    const { cSectionRate } = processDeliveryTypes(rawData)
    expect(cSectionRate).toBe(25)
  })

  it('MUST return 0 rate when no deliveries', () => {
    const { cSectionRate, deliveryTypes } = processDeliveryTypes([])
    expect(cSectionRate).toBe(0)
    expect(deliveryTypes).toEqual([])
  })

  it('MUST map raw data to DeliveryTypeData format', () => {
    const rawData = [
      { person_labour_type_name: 'Normal', count: 80 },
      { person_labour_type_name: 'C-Section', count: 20 },
    ]
    const { deliveryTypes } = processDeliveryTypes(rawData)

    expect(deliveryTypes).toHaveLength(2)
    expect(deliveryTypes[0]).toMatchObject({ type: 'Normal', count: 80, percentage: 80 })
    expect(deliveryTypes[1]).toMatchObject({ type: 'C-Section', count: 20, percentage: 20 })
  })
})

describe('sortAndCalculatePercentages', () => {
  it('MUST sort data by order keys', () => {
    const data = [
      { category: 'B', count: 10 },
      { category: 'A', count: 20 },
      { category: 'C', count: 5 },
    ]
    const orderKeys = ['A', 'B', 'C']
    const result = sortAndCalculatePercentages(data, orderKeys, 'category')

    expect(result[0].category).toBe('A')
    expect(result[1].category).toBe('B')
    expect(result[2].category).toBe('C')
  })

  it('MUST calculate percentage for each item', () => {
    const data = [
      { category: 'X', count: 50 },
      { category: 'Y', count: 50 },
    ]
    const result = sortAndCalculatePercentages(data, ['X', 'Y'], 'category')

    expect(result[0].percentage).toBe(50)
    expect(result[1].percentage).toBe(50)
  })

  it('MUST handle empty data array', () => {
    const result = sortAndCalculatePercentages([], ['A', 'B'], 'category' as never)
    expect(result).toEqual([])
  })
})
