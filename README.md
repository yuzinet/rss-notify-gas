# rss-notify-gas

RSSフィードを定期チェックして新着記事をWebhookで通知するGoogle Apps Scriptです。

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. claspのログイン & プロジェクト設定

```bash
# Googleアカウントでログイン
npm run login

# .clasp.json を作成（example をコピーして scriptId を設定）
cp .clasp.json.example .clasp.json
# .clasp.json の YOUR_SCRIPT_ID_HERE を実際のスクリプトIDに書き換える
```

スクリプトIDはGASエディタのURL `https://script.google.com/d/<SCRIPT_ID>/edit` から確認できます。

### 3. スクリプトプロパティの設定

GASエディタ > [プロジェクトの設定] > [スクリプト プロパティ] で以下を設定してください。

| キー | 値 |
|------|----|
| `WEBHOOK_URL` | Slack / Discord などの Incoming Webhook URL |

### 4. RSSフィードの登録

`src/config.js` の `RSS_FEEDS` 配列にフィードURLを追加します。

```js
RSS_FEEDS: [
  'https://example.com/feed.xml',
],
```

### 5. スクリプトをGASにプッシュ

```bash
npm run push
```

### 6. トリガーの設定

GASエディタ > [トリガー] から `checkAndNotify` 関数を時間ベースのトリガーで実行するよう設定します（例: 1時間おき）。

## ディレクトリ構成

```
.
├── src/
│   ├── main.js       # エントリーポイント（checkAndNotify関数）
│   ├── config.js     # 設定値・スクリプトプロパティ
│   ├── rss.js        # RSSフィードの取得・パース
│   └── notify.js     # Webhook通知
├── appsscript.json   # GASマニフェスト
├── package.json
├── .clasp.json       # clasp設定（gitignore済み）
└── .clasp.json.example
```