import { describe, expect, it } from 'vitest'
import { rateKey } from './http'

const request = (ip?: string) =>
  new Request('https://freeitchgames.win/api/verify', { headers: ip === undefined ? {} : { 'cf-connecting-ip': ip } })

describe('rateKey', () => {
  it.each([
    ['203.0.113.9', '203.0.113.9'],
    ['2001:db8:1234:5678:9abc:def0:1:2', '2001:db8:1234:5678::/64'],
    ['2001:DB8:0:0012::1', '2001:db8:0:12::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['::ffff:198.51.100.7', '198.51.100.7'],
  ])('%s → %s', (ip, key) => {
    expect(rateKey(request(ip))).toBe(key)
  })

  it('puts every address of one IPv6 /64 in the same bucket', () => {
    expect(rateKey(request('2001:db8:aa:bb:1::1'))).toBe(rateKey(request('2001:db8:aa:bb:ffff:ffff:ffff:ffff')))
  })

  it('uses one shared key when the address is missing', () => {
    expect(rateKey(request())).toBe('unknown')
    expect(rateKey(request(''))).toBe('unknown')
  })
})
