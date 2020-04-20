const path = require('path');
const os = require('os');
const uuid = require('uuid').v4;
const unzip = require('./src/unzip');
const klaw = require('klaw-sync');
const fs = require('fs-extra');
const {JSDOM} = require('jsdom');
const pinyin = require('pinyin-en');
const {serializeToString} = require('xmlserializer');
const {parse} = require('parse5');

const relativePath = process.argv[2];
if (!relativePath) throw new Error('No input provided!');
const inputPath = path.resolve(__dirname, process.argv[2]);
const tempPath = path.join(os.tmpdir(), 'pinyin-epub', uuid());
fs.ensureDirSync(tempPath);

unzip(inputPath).to(tempPath)
  .then(async () => {
    const files = klaw(tempPath, {
      filter(item) {
        return /\.x?html/i.test(path.extname(item.path));
      },
      traverseAll: true,
    });

    for (const file of files) {
      const html = fs.readFileSync(file.path, 'utf-8');
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const nodes = [document.body];
      while (nodes.length) {
        const node = nodes.pop();
        node.childNodes.forEach(child => nodes.push(child));
        if (node.nodeType !== 3) continue;
        const pinYin = await pinyin(node.textContent);
        node.textContent = pinYin.reduce((s, p) => s + ' ' + p.pinyin, '');
      }
      const xhtml = serializeToString(parse(dom.serialize()));
      fs.writeFileSync(file.path, xhtml);
    }

    console.log('Directory saved: ', tempPath);
  });
