import filterUSN from '../filterUSN'

test(`filterUSN`, () => {
  expect(filterUSN(`uuid:dc4a2725-c23e-48ce-b30c-e420f4f12365`)).toEqual(
    `uuid:dc4a2725-c23e-48ce-b30c-e420f4f12365`,
  )
  expect(
    filterUSN(
      `uuid:dc4a2725-c23e-48ce-b30c-e420f4f12365::urn:schemas-upnp-org:device:MediaRenderer:1`,
    ),
  ).toEqual(`uuid:dc4a2725-c23e-48ce-b30c-e420f4f12365`)
  expect(filterUSN(`something-completely-else`)).toEqual(
    `something-completely-else`,
  )
})
