// =============================================================================
// T019 - Pregnancy Type Guard Tests
// Verifies type guards correctly validate pregnancy data structures
// =============================================================================

import { describe, it, expect } from 'vitest'
import {
  isPregnancyKpis,
  isDeliveryTrendData,
  isDeliveryTypeData,
  isRecentDelivery,
  isHighRiskPregnancy,
  isUpcomingEdc,
} from '@/types/pregnancy'

describe('pregnancy type guards', () => {
  describe('isPregnancyKpis', () => {
    it('MUST return true for valid PregnancyKpis object', () => {
      const valid = {
        activePregnancies: 10,
        newAncThisMonth: 5,
        dueWithin30Days: 3,
        deliveriesThisMonth: 8,
        cSectionRate: 25.5,
        highRiskCount: 2,
        ttVaccineCoverage: 80.0,
        anc5PlusCoverage: 75.0,
        firstAncBefore12Weeks: 65.0,
        anc8QualityCompletion: 52.0,
        lowBirthWeightRate: 8.5,
        pretermBirthRate: 12.0,
        lowApgarRate: 3.2,
        stillbirthRate: 0.5,
      }
      expect(isPregnancyKpis(valid)).toBe(true)
    })

    it('MUST return false for missing required field', () => {
      const invalid = {
        activePregnancies: 10,
        // missing other fields
      }
      expect(isPregnancyKpis(invalid)).toBe(false)
    })

    it('MUST return false for null', () => {
      expect(isPregnancyKpis(null)).toBe(false)
    })

    it('MUST return false for non-object', () => {
      expect(isPregnancyKpis('string')).toBe(false)
      expect(isPregnancyKpis(123)).toBe(false)
      expect(isPregnancyKpis(undefined)).toBe(false)
    })

    it('MUST return false for wrong field types', () => {
      const invalid = {
        activePregnancies: '10',
        newAncThisMonth: 5,
        dueWithin30Days: 3,
        deliveriesThisMonth: 8,
        cSectionRate: 25.5,
        highRiskCount: 2,
        ttVaccineCoverage: 80.0,
        anc5PlusCoverage: 75.0,
      }
      expect(isPregnancyKpis(invalid)).toBe(false)
    })
  })

  describe('isDeliveryTrendData', () => {
    it('MUST return true for valid array element', () => {
      expect(isDeliveryTrendData({ month: '2026-01', deliveries: 15 })).toBe(true)
    })

    it('MUST return false for wrong types', () => {
      expect(isDeliveryTrendData({ month: '2026-01', deliveries: '15' })).toBe(false)
      expect(isDeliveryTrendData({ month: 123, deliveries: 15 })).toBe(false)
    })

    it('MUST return false for null', () => {
      expect(isDeliveryTrendData(null)).toBe(false)
    })

    it('MUST return false for non-object', () => {
      expect(isDeliveryTrendData('string')).toBe(false)
      expect(isDeliveryTrendData(123)).toBe(false)
    })

    it('MUST return false for missing fields', () => {
      expect(isDeliveryTrendData({ month: '2026-01' })).toBe(false)
      expect(isDeliveryTrendData({ deliveries: 15 })).toBe(false)
    })
  })

  describe('isDeliveryTypeData', () => {
    it('MUST return true for valid object', () => {
      expect(isDeliveryTypeData({ type: 'Normal', count: 10, percentage: 50.0 })).toBe(true)
    })

    it('MUST return false for wrong types', () => {
      expect(isDeliveryTypeData({ type: 'Normal', count: '10', percentage: 50.0 })).toBe(false)
      expect(isDeliveryTypeData({ type: 123, count: 10, percentage: 50.0 })).toBe(false)
    })

    it('MUST return false for null', () => {
      expect(isDeliveryTypeData(null)).toBe(false)
    })

    it('MUST return false for missing fields', () => {
      expect(isDeliveryTypeData({ type: 'Normal', count: 10 })).toBe(false)
      expect(isDeliveryTypeData({ type: 'Normal', percentage: 50.0 })).toBe(false)
    })
  })

  describe('isRecentDelivery', () => {
    it('MUST return true for valid delivery record', () => {
      expect(isRecentDelivery({
        laborDate: '2026-03-27',
        hn: '123456',
        patientName: 'นางสมศรี สมบัติ',
        ga: 38,
        deliveryType: 'Normal',
        birthWeight: 3200,
        apgar1: 8,
        apgar5: 9,
      })).toBe(true)
    })

    it('MUST return true for minimal required fields', () => {
      expect(isRecentDelivery({
        laborDate: '2026-03-27',
        hn: '123456',
        patientName: 'Test Patient',
      })).toBe(true)
    })

    it('MUST return false for null', () => {
      expect(isRecentDelivery(null)).toBe(false)
    })

    it('MUST return false for missing required fields', () => {
      expect(isRecentDelivery({
        laborDate: '2026-03-27',
        hn: '123456',
      })).toBe(false)
    })

    it('MUST return false for wrong types', () => {
      expect(isRecentDelivery({
        laborDate: '2026-03-27',
        hn: 123456,
        patientName: 'Test',
      })).toBe(false)
    })
  })

  describe('isHighRiskPregnancy', () => {
    it('MUST return true for valid high risk pregnancy record', () => {
      expect(isHighRiskPregnancy({
        hn: '123456',
        patientName: 'นางสมศรี สมบัติ',
        edc: '2026-06-01',
        riskLevel: 3,
        riskList: 'ห้อง, เบาหวาน',
      })).toBe(true)
    })

    it('MUST return true for minimal required fields', () => {
      expect(isHighRiskPregnancy({
        hn: '123456',
        patientName: 'Test Patient',
      })).toBe(true)
    })

    it('MUST return false for null', () => {
      expect(isHighRiskPregnancy(null)).toBe(false)
    })

    it('MUST return false for missing required fields', () => {
      expect(isHighRiskPregnancy({
        hn: '123456',
      })).toBe(false)
    })
  })

  describe('isUpcomingEdc', () => {
    it('MUST return true for valid upcoming EDC record', () => {
      expect(isUpcomingEdc({
        hn: '123456',
        patientName: 'นางสมศรี สมบัติ',
        edc: '2026-06-01',
        daysRemaining: 30,
      })).toBe(true)
    })

    it('MUST return false for null', () => {
      expect(isUpcomingEdc(null)).toBe(false)
    })

    it('MUST return false for missing required fields', () => {
      expect(isUpcomingEdc({
        hn: '123456',
        patientName: 'Test',
        edc: '2026-06-01',
      })).toBe(false)
    })

    it('MUST return false for wrong types', () => {
      expect(isUpcomingEdc({
        hn: '123456',
        patientName: 'Test',
        edc: '2026-06-01',
        daysRemaining: '30',
      })).toBe(false)
    })
  })
})
