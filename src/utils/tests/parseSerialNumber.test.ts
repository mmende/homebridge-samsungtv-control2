import parseSerialNumber from '../parseSerialNumber'

test(`parseSerialNumber`, () => {
  const model1 = parseSerialNumber(`UE40D6100`)
  expect(model1).not.toBeFalsy()
  expect(model1!.year).toEqual(2011)
  expect(model1!.market).toEqual(`Europe`)
  expect(model1!.technology).toEqual(`LED`)

  const model2 = parseSerialNumber(`UE40J6300`)
  expect(model2).not.toBeFalsy()
  expect(model2!.year).toEqual(2015)
  expect(model2!.market).toEqual(`Europe`)
  expect(model2!.technology).toEqual(`LED`)

  const model3 = parseSerialNumber(`QA42JU6500`)
  expect(model3).not.toBeFalsy()
  expect(model3!.market).toEqual(`Asia`)
  expect(model3!.technology).toEqual(`QLED (2017)`)
  expect(model3!.size).toEqual(42)
  expect(model3!.year).toEqual(2015)

  const model4 = parseSerialNumber(`UN55TU7000FXZA`)
  expect(model4).not.toBeFalsy()
  expect(model4!.market).toEqual(`Northamerica`)
  expect(model4!.technology).toEqual(`LED`)
  expect(model4!.size).toEqual(55)
  expect(model4!.year).toEqual(2020)

  const model4 = parseSerialNumber(`laskdnalskndla`)
  expect(model4).toBeFalsy()
})
