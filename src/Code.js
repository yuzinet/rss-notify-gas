function checkRSS() {
  const props = PropertiesService.getScriptProperties();
  const lineToken = props.getProperty('LINE_TOKEN');
  const rssUrl = props.getProperty('RSS_URL');
  const lastLink = props.getProperty('LAST_LINK');
  const lastPubDate = props.getProperty('LAST_PUB_DATE');

  if (!lineToken || !rssUrl) {
    console.error('ScriptプロパティにLINE_TOKENまたはRSS_URLが設定されていません。');
    return;
  }

  // RSS取得
  const response = UrlFetchApp.fetch(rssUrl);
  const xml = XmlService.parse(sanitizeXmlEntities(response.getContentText()));
  const root = xml.getRootElement();
  const channel = root.getChild('channel');
  const items = channel.getChildren('item');

  if (items.length === 0) return;

  // 最新記事の情報を取得
  const latestItem = items[0];
  const title = latestItem.getChildText('title');
  const link = latestItem.getChildText('link');
  const pubDate = latestItem.getChildText('pubDate');

  if (link !== lastLink) {
    // 新着記事
    sendLineBroadcast(lineToken, '新着記事', title, link);
    props.setProperty('LAST_LINK', link);
    props.setProperty('LAST_PUB_DATE', pubDate);
  } else if (pubDate !== lastPubDate) {
    // 同じリンクでも pubDate が変わっていたら更新記事として通知
    sendLineBroadcast(lineToken, '更新記事', title, link);
    props.setProperty('LAST_PUB_DATE', pubDate);
  }
}

function sanitizeXmlEntities(text) {
  const HTML_ENTITIES = {
    'hellip': '…', 'nbsp': '\u00A0', 'mdash': '—', 'ndash': '–',
    'ldquo': '\u201C', 'rdquo': '\u201D', 'lsquo': '\u2018', 'rsquo': '\u2019',
    'bull': '•', 'copy': '©', 'reg': '®', 'trade': '™',
    'laquo': '«', 'raquo': '»', 'middot': '·', 'times': '×',
    'divide': '÷', 'euro': '€', 'pound': '£', 'yen': '¥',
    'deg': '°', 'plusmn': '±', 'para': '¶', 'sect': '§',
    'frac14': '¼', 'frac12': '½', 'frac34': '¾',
  };
  const VALID_XML_ENTITIES = new Set(['amp', 'lt', 'gt', 'apos', 'quot']);
  return text.replace(/&([a-zA-Z]+);/g, (match, name) => {
    if (VALID_XML_ENTITIES.has(name)) return match;
    if (HTML_ENTITIES[name]) return HTML_ENTITIES[name];
    return '&amp;' + name + ';'; // 未知のエンティティはエスケープ
  });
}

function sendLineBroadcast(token, label, title, link) {
  const url = 'https://api.line.me/v2/bot/message/broadcast';
  const payload = {
    messages: [{
      type: 'text',
      text: `【${label}】\n${title}\n${link}`
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${token}`
    },
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(url, options);
}