'use strict'

const { test } = require('tap')
const {
  LDAPError,
  ConnectionError,
  AbandonedError,
  TimeoutError,
  ConstraintViolationError,
  getError,
  LDAP_OTHER,
  LDAP_REFERRAL,
  LDAP_NO_SUCH_OBJECT
} = require('../lib')

test('basic error', function (t) {
  const msg = 'mymsg'
  const err = new LDAPError(msg, null, null)
  t.ok(err)
  t.equal(err.name, 'LDAPError')
  t.equal(err.code, LDAP_OTHER)
  t.equal(err.dn, '')
  t.equal(err.message, msg)
  t.end()
})

test('exports ConstraintViolationError', function (t) {
  const msg = 'mymsg'
  const err = new ConstraintViolationError(msg, null, null)
  t.ok(err)
  t.equal(err.name, 'ConstraintViolationError')
  t.equal(err.code, 19)
  t.equal(err.dn, '')
  t.equal(err.message, msg)
  t.end()
})

test('"custom" errors', function (t) {
  const errors = [
    { name: 'ConnectionError', Func: ConnectionError },
    { name: 'AbandonedError', Func: AbandonedError },
    { name: 'TimeoutError', Func: TimeoutError }
  ]

  errors.forEach(function (entry) {
    const msg = entry.name + 'msg'
    const err = new entry.Func(msg)
    t.ok(err)
    t.equal(err.name, entry.name)
    t.equal(err.code, LDAP_OTHER)
    t.equal(err.dn, '')
    t.equal(err.message, msg)
  })

  t.end()
})

test('getError preserves referrals from LDAPResult', function (t) {
  const LDAPResult = require('@ldapjs/messages').LdapResult
  const res = new LDAPResult({
    status: LDAP_REFERRAL,
    matchedDN: '',
    diagnosticMessage: 'Referral',
    referrals: [
      'ldap://dc1.example.com:389/CN=user,DC=example,DC=com',
      'ldap://dc2.example.com:389/CN=user,DC=example,DC=com'
    ]
  })
  const err = getError(res)
  t.equal(err.name, 'ReferralError')
  t.equal(err.code, LDAP_REFERRAL)
  t.same(err.referrals, [
    'ldap://dc1.example.com:389/CN=user,DC=example,DC=com',
    'ldap://dc2.example.com:389/CN=user,DC=example,DC=com'
  ])
  t.end()
})

test('getError returns empty referrals when none present', function (t) {
  const LDAPResult = require('@ldapjs/messages').LdapResult
  const res = new LDAPResult({
    status: LDAP_NO_SUCH_OBJECT,
    matchedDN: 'dc=example,dc=com',
    diagnosticMessage: 'not found'
  })
  const err = getError(res)
  t.equal(err.name, 'NoSuchObjectError')
  t.same(err.referrals, [])
  t.end()
})

test('dn setter updates backing field', function (t) {
  const err = new LDAPError('test', null, null)
  t.equal(err.dn, '')
  err.dn = 'dc=example,dc=com'
  t.equal(err.dn, 'dc=example,dc=com')
  t.end()
})
