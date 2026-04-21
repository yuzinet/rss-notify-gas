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
  const xml = XmlService.parse(response.getContentText());
  const root = xml.getRootElement();
  const channel = root.getChild('channel');
  const items = channel.getChildren('item');

  if (items.length === 0) return;

  // 前回チェック以降の新着記事をすべて抽出
  // フィードは新しい順なので、lastLink が見つかるまでの記事が新着
  let newItems = [];
  if (!lastLink) {
    // 初回実行時は最新記事のみ通知（全件通知を避けるため）
    newItems = [items[0]];
  } else {
    for (let i = 0; i < items.length; i++) {
      const link = items[i].getChildText('link');
      if (link === lastLink) break;
      newItems.push(items[i]);
    }
  }

  if (newItems.length === 0) {
    // 新着なし。最新記事の pubDate が変わっていれば更新通知
    const latestItem = items[0];
    const latestLink = latestItem.getChildText('link');
    const latestPubDate = latestItem.getChildText('pubDate');
    if (latestLink === lastLink && latestPubDate !== lastPubDate) {
      const title = latestItem.getChildText('title');
      sendLineBroadcast(lineToken, '更新記事', title, latestLink);
      props.setProperty('LAST_PUB_DATE', latestPubDate);
    }
    return;
  }

  // 古い順（昇順）に通知する
  newItems.reverse().forEach(item => {
    const title = item.getChildText('title');
    const link = item.getChildText('link');
    sendLineBroadcast(lineToken, '新着記事', title, link);
  });

  // 最新記事の情報を保存
  const latestItem = items[0];
  props.setProperty('LAST_LINK', latestItem.getChildText('link'));
  props.setProperty('LAST_PUB_DATE', latestItem.getChildText('pubDate'));
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