const request = require('request')
const helpers = require('../../../lib/test_helpers')

describe('road', () => {
  it('should return an array of objects containing correct fields', (done) => {
    const fieldsToCheckFor = [
      'routeId',
      'routeName',
      'segmentId',
      'segmentSerial',
      'segmentName',
      'segmentShortName',
      'segmentSignal',
      'conditionId',
      'conditionDescription',
      'conditionShortDescription',
      'priority',
      'comment',
      'date',
      'isHighlands',
      'colorCode',
      'conditionUpdated',
      'surfaceCondition',
    ]
    const params = helpers.testRequestParams('/road')
    const resultHandler = helpers.testRequestHandlerForFields(done, fieldsToCheckFor)
    request.get(params, resultHandler)
  })
})