const fs = require('fs')
const globby = require('globby')
const marked = require('marked');

(async () => {
  const paths = await globby(['./docs/*.md', './endpoints/**/*.md', '!node_modules/**'])

  let content = ''
  paths.forEach((path) => {
    content += fs.readFileSync(path, 'utf8')
  })
  const html = marked(content, { escapeMarkdown: false })

  if (!fs.existsSync('./docs/dist/')) {
    fs.mkdirSync('./docs/dist/')
  }
  fs.writeFileSync('./docs/dist/index.html', html, 'utf8')
})().catch((error) => {
  console.error(error)
})
