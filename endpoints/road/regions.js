/* eslint-disable */

const request = require('request')
const xml2js = require('xml2js')
const h = require('apis-helpers')
const cheerio = require('cheerio')
const app = require('../../server')

const parseString = xml2js.parseString

const sourceUrl = 'http://gagnaveita.vegagerdin.is/api/faerd2014_1'

const getRegionSegments = (url) => new Promise((resolve, reject) => {
  request(url, (error, response, body) => {
    if (error) {
      reject(error)
    }

    let $

    try {
      $ = cheerio.load(body)
    } catch (e) {
      return reject(error)
    }
    const hotspots = $('.vg-roadmap-hotspot')

    const segments = []
    // Loop through hotspots
    hotspots.each(function () {
      // This hotspot
      const hotspot = $(this)

      // Find hotspot info
      const hotspotinfo = hotspot.attr('data-hotspotinfo')
      const obj = JSON.parse(hotspotinfo.replace(/'/g, '"'))
      if (obj.idleid)
        segments.push(parseInt(obj.idleid, 10))
    })
    resolve(segments)
  })
})
const parseFeed = function (callback, data, regionUrl) {
  parseString(data, { explicitRoot: false }, (err, result) => {
    if (err) return callback(new Error(`Parsing of XML failed. Title ${err}`))
    const regionSegments = getRegionSegments(regionUrl)
    regionSegments.then((segments) => {
      const roads = []

      for (let i = 0; i < result.Faerd.length; ++i) {
        const Road = result.Faerd[i]
        const shortSegmentId = parseInt(Road.IdButur[0].slice(0, 5), 10)
        if (segments.includes(shortSegmentId))
          roads.push({
            routeId: Road.IdLeid[0].length > 0 ? Road.IdLeid[0] : null, // Can be null
            routeName: Road.LeidNafn[0].length > 0 ? Road.LeidNafn[0] : null, // Can be null
            segmentId: parseInt(Road.IdButur[0], 10),
            segmentSerial: Road.Rodun[0],
            segmentName: Road.LangtNafn[0],
            segmentShortName: Road.StuttNafn[0],
            segmentSignal: Road.Skilti[0].length > 0 ? Road.Skilti[0] : null,
            conditionId: Road.IdAstand[0],
            conditionDescription: Road.FulltAstand[0],
            conditionShortDescription: Road.StuttAstand[0],
            priority: parseInt(Road.Forgangur[0], 10),
            comment: Road.Aths[0].length > 0 ? Road.Aths[0] : null,
            date: Road.DagsKeyrtUt[0],
            isHighlands: parseInt(Road.ErHalendi[0], 2) === 1 ? true : false,
            colorCode: Road.Linulitur[0].length > 0 ? Road.Linulitur[0] : null,
            conditionUpdated: Road.DagsSkrad[0],
            surfaceCondition: Road.AstandYfirbords[0],
          })
      }
      return callback(null, roads)
    })
  })
}
const getFeed = function (url, regionUrl, callback) {
  request.get({
    headers: { 'User-Agent': h.browser(), 'Content-Type': 'application/xml; charset=utf-8' },
    encoding: 'utf-8',
    url,
  }, (error, response, body) => {
    if (error) return callback(new Error(`${url} did not respond ${JSON.stringify(error)}`))
    parseFeed(callback, body, regionUrl)
  })
}

const serve = function (url, regionUrl, res, next) {
  getFeed(url, regionUrl, (err, data) => {
    if (err) {
      console.error(err)
      return next(502)
    }
    res.cache(1800).json({ results: data })
  })
}

app.get('/road/:region', (req, res, next) => {
  const regionParam = req.params.region
  let regionUrl = null
  if (regionParam === 'reykjavik')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/reykjavik-og-nagrenni-faerd-kort/'
  else if (regionParam === 'west')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/vesturland-faerd-kort/'
  else if (regionParam === 'southwest')
    regionUrl = 'http://vegagerdin.is/ferdaupplysingar/faerd-og-vedur/sudvesturland-faerd-kort/'
  else if (regionParam === 'westfjords')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/vestfirdir-faerd-kort/'
  else if (regionParam === 'south')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/sudurland-faerd-kort/'
  else if (regionParam === 'north')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/nordurland-faerd-kort/'
  else if (regionParam === 'east')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/austurland-faerd-kort/'
  else if (regionParam === 'northeast')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/nordausturland-faerd-kort/'
  else if (regionParam === 'southeast')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/sudausturland-faerd-kort/'
  else if (regionParam === 'highlands')
    regionUrl = 'http://www.vegagerdin.is/ferdaupplysingar/faerd-og-vedur/midhalendid-faerd-kort/'
  serve(sourceUrl, regionUrl, res, next)
})