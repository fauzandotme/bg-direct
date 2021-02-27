const tool = require('curl-ganteng');
const Cacheman = require('cacheman');
const fetch = require('node-fetch');
let cache = new Cacheman({engine: 'file', ttl: 1800});
const BG = function () {
}
BG.prototype.setCookie = function (cookie) {
  this.cookie = cookie;
}
BG.prototype.setLink = function (link) {
  this.link = link;
}
BG.prototype.get = function () {
  let current = this;
  return cache.get(current.link).then((done) => {
    if(done) return done;
    return fetch(current.link)
    .then(res => res.text())
    .then(getIframe)
    // .then(console.log)
    .then(getLink)
    .then((done) => {
      cache.set(current.link, done, (err) => {
        console.log(err);
      });
      return done;
    })
  })
}
function getIframe(body) {
  let $ = tool.jquery(body);
  let iframes = [];
  let output = $('iframe').each((index, frame) => {
    // console.log(frame)
    let src = $(frame).attr('src');
    if(src) iframes.push(src);
  })
  return iframes;
}
function getLink(links) {
  let promises = [];
  links.map((link) => {
    promises.push(getDirectLink(link));
  })
  return Promise.all(promises);
}
function getDirectLink(link) {
  return fetch(link).then(res => res.text()).then((body) => {
    try {
      let link = body.match(/var VIDEO_CONFIG+.+/g)
      link = link[0].replace(/<(?:.|\n)*?>/gm, '');
      eval(link);
      return VIDEO_CONFIG.streams.map((item) => {
        let output = {};
        output.link = item.play_url.replace(/.+googlevideo\.com/, 'https://redirector.googlevideo.com');
        output.quality = (item.format_id == 18)  ? 360 : (item.format_id == 22) ? 720 : false;
        return output;
      })
    } catch (e) {
      console.log(e);
      throw new Error(`Masih memproses video, cek kembali dalam beberapa menit`);
    }
  })
}
module.exports = BG;