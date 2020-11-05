import { getPercentile, dateDiff, toDays, toHours, getDelays2714 } from '../funcs'
import { LogDelay } from '../types'
const delayTestData:Array<LogDelay> = require('./delays2-7-14.json')

test('Datediff should be negative', () => {
  const date1 = '2020-01-06T13:42:13.842Z'
  const date2 = '2020-10-06T13:42:13.842Z'
  expect(dateDiff(date1, date2)).toBeLessThan(0)
})

test('Datediff should be positive', () => {
  const date1 = '2020-10-06T13:42:13.842Z'
  const date2 = '2020-01-06T13:42:13.842Z'
  expect(dateDiff(date1, date2)).toBeGreaterThan(0)
})

test('Datediff should provide correct values', () => {
  const date1 = '2020-10-06T13:42:13.842Z'
  const date2 = '2020-01-06T13:42:13.842Z'
  expect(dateDiff(date1, date2)).toBe(23673600000)
})

test('Convert to days should provide correct values', () => {
  expect(toDays(172800000)).toBe(2)
})

test('Convert to hours should provide correct values', () => {
  expect(toHours(3600000)).toBe(1)
})

test('Percentile of sample with same values is same as values', () => {
  const sampleData = [42,42,42,42,42,42,42]
  expect(getPercentile(42, sampleData)).toBe(42)
});

test('Percentile of 1 should be 2', () => {
  const sampleData = [2,4,6,8,13,16,22,35,40,42,48]
  expect(getPercentile(1, sampleData)).toBe(2)
  /* expect(1+2).toBe(3); */
});

test('Percentile of 99 should be 48', () => {
  const sampleData = [2,4,6,8,13,16,22,35,40,42,48]
  expect(getPercentile(99, sampleData)).toBe(48)
  /* expect(1+2).toBe(3); */
});

test('Percentile of 70 should be 35', () => {
  const sampleData = [2,4,6,8,13,16,22,35,40,42,48]
  expect(getPercentile(70, sampleData)).toBe(35)
  /* expect(1+2).toBe(3); */
});

test('2, 7 and 14 day delays should be accurate', () => {
  const result = {
    "14Day": 36000000,
    "2Day": 14400000,
    "7Day": 25200000,
  }
  expect(getDelays2714(delayTestData)).toEqual(result)
  /* expect(1+2).toBe(3); */
});


