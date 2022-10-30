const express = require('express')
let app = express()
let http = require('http').createServer(app)

app.set('view engine', 'ejs')
app.use('/public', express.static(__dirname + '/public'))

let io = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
})

const requestModule = require('request')
const cheerio = require('cheerio')

const formidableMiddleware = require('express-formidable')
app.use(formidableMiddleware())

let mongodb = require('mongodb')
let mongoClient = mongodb.MongoClient

let htmlspecialchars = require('htmlspecialchars')

let HTMLParser = require('node-html-parser')
let database = null

function getTagContent(querySelector, content) {
  let tags = content.querySelectorAll(querySelector)
  let innerHTMLs = []
  for (let a = 0; a < tags.length; a++) {
    let content = ''

    let anchorTag = tags[a].querySelector('a')
    if (anchorTag != null) {
      content = anchorTag.innerHTML
    } else {
      content = tags[a].innerHTML
    }

    content = content.replace(/\s+/g, ' ').trim()

    if (content.length > 0) {
      innerHTMLs.push(content)
    }
  }
  return innerHTMLs
}

function crawlPage(url, callBack = null) {
  let pathArray = url.split('/')
  let protocol = pathArray[0]
  let host = pathArray[2]
  let baseUrl = protocol + '//' + host

  io.emit('crawl_update', 'Crawling page: ' + url)

  requestModule(url, async function (error, response, html) {
    if (!error && response.statusCode == 200) {
      let $ = cheerio.load(html)

      let page = await database.collection('pages').findOne({
        url: url,
      })
      if (page == null) {
        let html = $.html()
        let htmlContent = HTMLParser.parse(html)

        let allAnchors = htmlContent.querySelectorAll('a')
        let anchors = []
        for (let a = 0; a < allAnchors.length; a++) {
          let href = allAnchors[a].getAttribute('href')
          let title = allAnchors[a].innerHTML

          let hasAnyChildTag =
            allAnchors[a].querySelector('div') != null ||
            allAnchors[a].querySelector('img') != null ||
            allAnchors[a].querySelector('p') != null ||
            allAnchors[a].querySelector('span') != null ||
            allAnchors[a].querySelector('svg') != null ||
            allAnchors[a].querySelector('strong') != null

          if (hasAnyChildTag) {
            continue
          }

          if (href != null) {
            if (href == '#' || href.search('javascript:void(0)') != -1) {
              continue
            }

            let first4Words = href.substr(0, 4)

            if (href.search(url) == -1 && first4Words != 'http') {
              if (href[0] == '/') {
                href = baseUrl + href
              } else {
                href = baseUrl + '/' + href
              }
            }

            anchors.push({
              href: href,
              text: title,
            })
          }
        }
        io.emit(
          'crawl_update',
          htmlspecialchars('<a>') + ' tags has been crawled',
        )

        let titles = await getTagContent('title', htmlContent, url)
        let title = titles.length > 0 ? titles[0] : ''
        io.emit(
          'crawl_update',
          htmlspecialchars('<title>') + ' tag has been crawled',
        )

        let h1s = await getTagContent('h1', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<h1>') + ' tags has been crawled',
        )

        let h2s = await getTagContent('h2', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<h2>') + ' tags has been crawled',
        )

        let h3s = await getTagContent('h3', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<h3>') + ' tags has been crawled',
        )

        let h4s = await getTagContent('h4', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<h4>') + ' tags has been crawled',
        )

        let h5s = await getTagContent('h5', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<h5>') + ' tags has been crawled',
        )

        let h6s = await getTagContent('h6', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<h6>') + ' tags has been crawled',
        )

        let ps = await getTagContent('p', htmlContent, url)
        io.emit(
          'crawl_update',
          htmlspecialchars('<p>') + ' tags has been crawled',
        )

        let object = {
          url: url,
          anchors: anchors,
          title: title,
          h1s: h1s,
          h2s: h2s,
          h3s: h3s,
          h4s: h4s,
          h5s: h5s,
          h6s: h6s,
          ps: ps,
          time: new Date().getTime(),
        }

        try {
          await database.collection('pages').insertOne(object)
        } catch (e) {
          console.log(e)
        }
        io.emit('page_crawled', object)
        io.emit('crawl_update', 'Page crawled.')
      } else {
        io.emit('crawl_update', 'Page already crawled.')
      }

      if (callBack != null) {
        callBack()
      }
    }
  })
}

let months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

http.listen(3000, function () {
  console.log('Server started running at port: 3000')

  require('dotenv').config()
  const uri = process.env.URI
  mongoClient.connect(
    uri,
    {
      useUnifiedTopology: true,
    },
    function (error, client) {
      if (error) {
        throw error
      }
      database = client.db('web_crawler')
      console.log('Database connected')

      app.post('/reindex', async function (request, result) {
        let url = request.fields.url

        await database.collection('pages').deleteOne({
          url: url,
        })
        io.emit('page_deleted', url)

        crawlPage(url, function () {
          let backURL = request.header('Referer') || '/'
          result.redirect(backURL)
        })
      })

      app.post('/delete-page', async function (request, result) {
        let url = request.fields.url

        await database.collection('pages').deleteOne({
          url: url,
        })
        io.emit('page_deleted', url)

        let backURL = request.header('Referer') || '/'
        result.redirect(backURL)
      })

      app.get('/page/:url', async function (request, result) {
        let url = request.params.url

        let page = await database.collection('pages').findOne({
          url: url,
        })
        if (page == null) {
          result.render('404', {
            message: 'This page has not been crawled',
          })
          return false
        }

        result.render('page', {
          page: page,
        })
      })

      app.post('/crawl-page', async function (request, result) {
        let url = request.fields.url
        crawlPage(url)

        result.json({
          status: 'success',
          message: 'Page has been crawled',
          url: url,
        })
      })

      app.get('/', async function (request, result) {
        let pages = await database
          .collection('pages')
          .find({})
          .sort({
            time: -1,
          })
          .toArray()

        for (let index in pages) {
          let date = new Date(pages[index].time)
          let time =
            date.getDate() +
            ' ' +
            months[date.getMonth() + 1] +
            ', ' +
            date.getFullYear() +
            ' - ' +
            date.getHours() +
            ':' +
            date.getMinutes() +
            ':' +
            date.getSeconds()

          pages[index].time = time
        }

        result.render('index', {
          pages: pages,
        })
      })
    },
  )
})
