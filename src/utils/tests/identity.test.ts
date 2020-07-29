import { encodeIdentity, decodeIdentity } from '../identity'

test(`identity`, () => {
  const id = { hello: `world`, somthing: `42` }
  const idToken = encodeIdentity(id)
  expect(decodeIdentity(idToken)).toMatchObject(id)
})
