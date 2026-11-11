// data/home.ts の日本語版。構造は同じで、slug・リンク・アクセント色・タグは中国語版と共通。
import type * as zh from '../home'

export const hero: typeof zh.hero = {
  eyebrow: 'Frontend Engineer, Creative Development',
  title: ['コードでアイデアを形にし、', 'インタラクションでもっと'],
  intro: 'フロントエンド開発とインタラクションの実装に取り組み、モダンなフロントエンド技術でパフォーマンス・使いやすさ・ビジュアル表現を兼ね備えたウェブサイトを作っています。',
}

export const about: typeof zh.about = {
  photo: '/images/image0.webp',
  eyebrow: '自己紹介',
  title: '要件をこなすことから、問題を理解することへ。',
  body: [
    'Elio（李柏偉）です。主に Vue でウェブのインターフェースを開発しているフロントエンドエンジニアです。働き始めた頃は、画面を作って機能を動かすことを何より気にしていました。入社後は Vue 2 と Vue 3 のプロジェクトに同時に関わるようになり、既存コードの設計意図、フレームワーク間の違い、変更が及ぼす影響範囲を理解したうえで、適切な実装方法を決めるようになりました。',
    '仕事以外でも、個人プロジェクトを通じてフロントエンド技術とインタラクションデザインを探求しています。このサイトの 3D の遺跡と回廊は、Three.js と GLSL シェーダーを使って空間表現、モーション、ウェブのインタラクションを探った実験です。',
  ],
  facts: [
    { label: 'コア技術', text: '主に Vue 2 と Vue 3 で開発しており、Vuetify・PrimeVue・Nuxt UI などの UI フレームワークを使ってきました。個人プロジェクトでは Nuxt、TypeScript、Tailwind CSS でウェブアプリケーションを構築しています。インタラクションとビジュアルでは、Three.js、GLSL シェーダー、GSAP を使って 3D 表現やモーションの実装に取り組んでいます。' },
    { label: '実務経験', text: '既存システムの保守、Vue 2 と Vue 3 のプロジェクト開発、UI の調整、コンポーネントの挙動のデバッグを経験してきました。コンポーネントのインタラクションの不具合やスタイルの問題に対応し、修正の際は既存機能への影響にも配慮しています。' },
    { label: 'エンジニアリングの考え方', text: 'コードの読みやすさ、コンポーネント構成、保守性を大切にしています。問題に直面したら、まず原因と影響範囲を明らかにしてから修正し、結果を検証します。すべての変更に明確な目的と根拠を持たせるようにしています。' },
  ],
}

export const projects: typeof zh.projects = [
  {
    slug: 'game-together', code: 'GT-01', accent: '#A79BFF', no: '01', kind: 'フルスタック 2025',
    tags: ['Vue 3', 'Vuetify', 'Node.js', 'MongoDB', 'WebSocket'],
    title: 'ゲーム仲間募集プラットフォーム',
    body: 'ゲーマーのためのリアルタイムなコミュニティ募集プラットフォームです。検索・絞り込み、イベント管理、リアルタイムチャットを組み合わせ、プレイヤーがすばやく仲間を見つけ、長く続くゲームコミュニティを作れるようにしました。',
    side: { icon: 'sports_esports', title: 'FEATURE HIGHLIGHTS', items: ['複数条件での検索と並べ替え（キーワード・地域・タグ・日付）', 'Socket.IO によるリアルタイムチャットと履歴の保存', 'JWT 認証と募集の作成・管理フロー'] },
    detail: {
      role: '個人開発',
      diagram: {
        title: '募集データの関連とリアルタイムチャット',
        caption: 'プロジェクトの内容をもとに描いた概念図：募集イベントが中心にあり、チャットルームは募集の詳細ページでのみ Socket 接続を確立し、離れると切断します。',
        nodes: [
          { id: 'user', label: 'ユーザー', sub: 'JWT 認証', x: 12, y: 30 },
          { id: 'group', label: '募集イベント', sub: 'Mongoose Schema', x: 44, y: 30 },
          { id: 'comment', label: 'コメント', x: 44, y: 6 },
          { id: 'room', label: '専用チャット', sub: 'Socket.IO', x: 76, y: 30 },
          { id: 'msg', label: 'チャット履歴', sub: 'MongoDB', x: 76, y: 54 },
          { id: 'page', label: '募集詳細ページ', sub: '入室で接続・退出で切断', x: 44, y: 54 },
        ],
        edges: [['user', 'group', '作成 / 参加'], ['group', 'comment', 'コメント'], ['group', 'room', '1 募集 1 ルーム'], ['room', 'msg', '保存'], ['page', 'room', 'connect']],
      },
      period: '2025',
      demo: 'https://eliowei.github.io/game-together',
      github: 'https://github.com/eliowei/game-together',
      headline: 'ゲーマーにとって、より効率的な仲間探しを。',
      overview: [
        'ゲーム仲間を探すとき、プレイヤーは SNS の投稿、チャットグループ、さまざまなプラットフォームを行き来して情報を探す必要があり、効率が悪いうえにイベントや参加状況の管理も難しくなりがちです。',
        '本プロジェクトは募集管理、イベント申し込み、リアルタイムチャット、コメント機能を統合し、イベントの立ち上げから交流までをひとつのプラットフォームで完結できるようにすることで、仲間探しの効率とコミュニティへの参加体験を高めました。',
      ],
      stack: [
        { group: 'frontend', items: ['Vue 3', 'Vuetify', 'Pinia', 'Axios'] },
        { group: 'backend', items: ['Node.js', 'Express', 'Socket.IO', 'JWT'], why: 'リアルタイムチャットで WebSocket を自前で扱うのは大変です。Socket.IO は接続まわりの細かい処理を多く引き受けてくれるので、そのまま採用しました。' },
        { group: 'database', items: ['MongoDB', 'Mongoose'], why: '職業訓練で学んだのが MongoDB でした。SQL Server などのリレーショナルデータベースに比べて、NoSQL の書き方は JavaScript に近く、学習も開発も進めやすかったためです。' },
        { group: 'tools', items: ['GitHub Actions', 'Render'] },
      ],
      features: [
        { title: '募集検索', body: '複数条件での検索と並べ替えにより、プレイヤーが条件に合う募集をすばやく見つけられます。', points: ['キーワード検索', '地域検索', 'タグ検索', '日付検索', '並べ替え'] },
        { title: '募集管理', body: '募集の作成・参加・管理のフローを一通り整え、主催者と参加者がスムーズに協力できるようにしました。', points: ['募集の作成', '募集の編集', 'お気に入り', 'コメント', '参加申請の管理'] },
        { title: 'リアルタイムチャット', body: 'WebSocket によるリアルタイム通信で、イベント前後のやり取りと調整をしやすくしました。', points: ['Socket.IO', 'リアルタイム同期', '履歴の保存', '専用チャットルーム'] },
      ],
      challenges: [
        { label: 'Realtime Communication', title: 'WebSocket 接続の管理', problem: 'ユーザーが頻繁にページを切り替えると、WebSocket 接続が重複して作られやすくなります。', solution: '募集の詳細ページでのみ接続し、ページを離れたらすぐに切断することで、Socket インスタンスの重複を防ぎました。', tags: ['WebSocket', 'MongoDB'] },
        { label: 'Authentication', title: 'JWT による権限検証', problem: '会員機能と管理機能には権限制御が必要で、未ログインや権限のないユーザーが重要なリソースにアクセスできないようにする必要があります。', solution: 'Passport JWT を使い、ミドルウェアでトークンとユーザーを検証することで、保護されたリソースに権限のあるユーザーだけがアクセスできるようにしました。', tags: ['JWT', 'Passport'] },
        { label: 'Search Experience', title: '複数条件検索の設計', problem: 'プレイヤーは通常、ゲームの種類、地域、日付などの条件でイベントを探します。', solution: 'キーワード・タグ・地域・日付で絞り込める複数条件の検索と並べ替えを設計し、イベントとのマッチングを効率化しました。', tags: ['MongoDB', 'Express'] },
        { label: 'Data Modeling', title: 'データ関連の設計', problem: 'イベント、ユーザー、チャットルーム、コメントの間には何層もの関連があり、構造が悪いとクエリが複雑になりやすくなります。', solution: 'Mongoose Schema でデータの関連構造を定義し、利用シーンに合わせてデータの分割と参照を設計することで、クエリ効率と保守性を両立させました。', tags: ['MongoDB', 'Mongoose'] },
      ],
      verification: [
        '現時点では手動テストが中心で、募集の作成・参加・コメント・チャットといった主要なフローを確認しています',
        '開発中にお気に入り表示などの画面の問題を一つずつ修正し、レスポンシブレイアウトも調整しました',
      ],
      retrospective: {
        learned: 'フロントエンドとバックエンドの開発を一通り経験したのはこれが初めてでした。データの関連は先に設計しておかないとクエリがどんどん複雑になること、リアルタイム接続は「つながるか」だけでなく接続・切断のタイミングまで考える必要があることを学びました。',
        next: 'まだ自動テストがなく、変更のたびに手動で回帰確認をしています。次はまず権限検証と募集フローのテストを追加します。',
      },
    },
  },
  {
    slug: 'tokyo-travel-site', code: 'TR-02', accent: '#7C96F2', no: '02', kind: '個人プロジェクト 2026',
    tags: ['Nuxt 4', 'Notion API', 'OpenAI', 'Gemini', 'Google Maps'],
    title: '東京個人旅行サイト',
    body: '9 月の東京旅行のために開発した旅程サイトです。Notion を CMS として使い、AI アシスタント、地図、支出記録、持ち物リストを統合しました。',
    side: { icon: 'travel_explore', title: 'TRIP TOOLKIT', items: ['Notion API によるコンテンツ管理', 'GPT と Gemini の AI アシスタント', 'Google Maps でのルート計画'] },
    detail: {
      period: '2026/06 — 2026/09',
      role: '個人開発',
      diagram: {
        title: 'Notion をコンテンツソースとするデータの流れ',
        caption: 'プロジェクトの内容をもとに描いた概念図：コンテンツは Notion で編集し、サーバールートと transformer で変換・キャッシュしてからフロントエンドに渡します。',
        nodes: [
          { id: 'notion', label: 'Notion', sub: '旅程・リスト・チケット', x: 10, y: 30 },
          { id: 'api', label: 'Nuxt サーバー', sub: '60 秒キャッシュ', x: 36, y: 30 },
          { id: 'tf', label: 'Transformer', sub: '独自の型に変換', x: 62, y: 30 },
          { id: 'web', label: 'ウェブサイト', x: 88, y: 18 },
          { id: 'ai', label: 'GPT / Gemini', sub: 'AI アシスタント', x: 88, y: 46 },
        ],
        edges: [['notion', 'api', 'Notion API'], ['api', 'tf'], ['tf', 'web'], ['web', 'ai', 'サーバールート']],
      },
      headline: '自分の東京旅行のために、本当に必要なツールを作る。',
      overview: [
        '9 月の東京への個人旅行のために開発しました。旅程、持ち物、買い物リストは何度も変わるため、Notion をコンテンツの管理画面として使い、サイトは読み込みと表示だけを担当します。管理画面を別に作る必要はありません。',
        '旅程のほかに、AI アシスタント、Google Maps、支出記録、ディズニーリゾートの計画も統合しています。',
      ],
      stack: [
        { group: 'frontend', items: ['Nuxt 4', 'Vue 3', 'TypeScript', 'Nuxt UI', 'Tailwind CSS'] },
        { group: 'content', items: ['Notion API'], why: '管理画面を自作するのは開発コストが高すぎます。Notion はもともとデータの整理に向いていて、内容を読み取る API もあるので、そのまま CMS として使いました。' },
        { group: 'ai', items: ['OpenAI', 'Gemini'] },
        { group: 'services', items: ['Google Maps', 'Vercel'] },
      ],
      features: [
        { title: 'Notion によるコンテンツ管理', body: '旅程、持ち物リスト、買い物リスト、チケットはすべて Notion で管理し、サーバールート経由で読み込むので、API キーがフロントエンドに出ることはありません。', points: ['サーバールート', 'Transformer', '60 秒キャッシュ'] },
        { title: 'AI 旅行アシスタント', body: 'GPT と Gemini を選べ、画像をアップロードして質問することもできます。Gemini のリクエストが多すぎるときは、自動的に OpenAI で回答します。', points: ['GPT', 'Gemini', '画像での質問', '自動フォールバック'] },
        { title: '地図とディズニーの計画', body: 'Google Maps JavaScript API でスポットとルートを表示し、繁体字中国語に整理したレストランのメニューも確認できます。', points: ['Marker', 'Polyline', 'メニュー翻訳'] },
        { title: '支出とリスト', body: '支出記録はカテゴリー、支払い方法、円換算に対応しています。チェック状態はブラウザに保存し、Notion には書き戻しません。', points: ['グラフ集計', 'localStorage', 'Zod 検証'] },
      ],
      challenges: [
        { label: 'Deployment', title: 'デプロイ後にデータファイルが見つからない', problem: 'API は実行時に node:fs で JSON を読み込んでいました。ローカルでは問題ないのに、Vercel にデプロイするとファイルが見つかりません。バンドラーが動的なパスを追跡できないためです。', solution: 'Nitro の serverAssets でデータをサーバービルドに埋め込み、useStorage() で読み込むように変更しました。', tags: ['Nitro', 'Vercel'] },
        { label: 'Data Integrity', title: 'Notion の slug は一意とは限らない', problem: '同じホテルに 2 回泊まると同じ slug ができてしまい、slug だけで検索する旅程詳細ページが誤ったデータを取得していました。', solution: '何日目かでも旅程を区別し、そのパラメーターをキャッシュのキーにも含めることで、別の日が同じキャッシュを使わないようにしました。', tags: ['Notion API', 'Cache'] },
        { label: 'Reliability', title: 'AI の利用枠が尽きたときのフォールバック', problem: 'Gemini が 429 を返すと、チャット機能が使えなくなっていました。', solution: 'サーバーで 429 を捕捉し、自動的に OpenAI で回答するようにしたので、ユーザーが自分で切り替える必要はありません。', tags: ['Gemini', 'OpenAI'] },
      ],
      verification: [
        '9 月の東京旅行で実際に使用し、主要な機能はよく使いましたが、旅行中に問題は起きませんでした',
        'ローカルと Vercel のデプロイ環境の両方でテストしたことで、メニューのデータがデプロイ後にだけ読み込めないことに気づきました',
        '同じホテルに 2 回泊まる場合でも、日ごとに正しい旅程が表示されることを確認しました',
        '現時点では自動テストはなく、手動テストが中心です',
      ],
      retrospective: {
        learned: 'Notion を CMS にしたことで管理画面を作る時間が省け、旅程もいつでも調整できました。ただしフィールドは名前で対応付けられるため、名前を変えてもエラーにならず、データが正しいかどうかはプログラム側でチェックする必要があります。',
        next: 'Notion のクエリはまだページネーションに対応しておらず、100 件を超えると読み切れません。旅程の画像は期限付きの署名 URL なので、キャッシュ戦略にも調整が必要です。支出とリストの状態はブラウザに保存しているため、別の端末では見られません。',
      },
    },
  },
  {
    slug: 'personal-portfolio', code: 'PF-03', accent: '#E6E1D6', no: '03', kind: '個人サイト 2026',
    tags: ['Nuxt 4', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Nuxt Content', 'GA4', 'GTM'],
    title: '個人ブランドサイト',
    body: 'Nuxt で構築した個人ブランドサイトです。サービスと事例を紹介し、SEO、GA4、GTM を統合しています。',
    side: { icon: 'web', title: 'SITE ARCHITECTURE', items: ['SEO 対策（サイトマップ、メタタグ、Open Graph）', 'GSAP によるページ遷移とスクロールアニメーション', 'Nuxt Content によるコンテンツ駆動の構成'] },
    detail: {
      role: '個人開発',
      diagram: {
        title: 'コンテンツ駆動のページ生成フロー',
        caption: 'プロジェクトの内容をもとに描いた概念図：作品は Markdown で構造化して管理し、共通のテンプレートでページを生成、SSR でメタ情報とサイトマップを出力します。',
        nodes: [
          { id: 'md', label: 'Markdown', sub: '作品データ', x: 10, y: 30 },
          { id: 'content', label: 'Nuxt Content', sub: '構造化クエリ', x: 36, y: 30 },
          { id: 'tpl', label: 'ページテンプレート', sub: 'Case Study', x: 62, y: 30 },
          { id: 'ssr', label: 'SSR 出力', sub: 'Meta / OG', x: 88, y: 18 },
          { id: 'map', label: 'Sitemap', x: 88, y: 46 },
        ],
        edges: [['md', 'content'], ['content', 'tpl', '共通テンプレート'], ['tpl', 'ssr'], ['tpl', 'map']],
      },
      period: '2026',
      demo: 'https://elioflowra.com/',
      headline: '個人ブランドとプロフェッショナルなイメージを伝えるプラットフォーム。',
      overview: ['作品、技術力、サービス内容を紹介する個人ブランドサイトです。検索での見つけやすさ、ページ遷移の体験、コンテンツの保守のしやすさを重視しました。'],
      stack: [
        { group: 'frontend', items: ['Nuxt 4', 'Vue 3', 'TypeScript', 'Tailwind CSS'] },
        { group: 'animation', items: ['GSAP', 'Vue Transition'] },
        { group: 'content', items: ['Nuxt Content', 'Markdown'] },
        { group: 'analytics', items: ['GA4', 'GTM'] },
      ],
      features: [
        { title: 'ケーススタディの紹介', body: 'プロジェクトをケーススタディの形で紹介し、課題、解決策、技術的な実装をわかりやすく示します。', points: ['プロジェクト分類', '画像ギャラリー', '技術タグ', 'プロジェクト詳細ページ'] },
        { title: 'SEO とコンテンツ管理', body: 'Nuxt Content とメタ設定により、検索エンジンへのインデックスとコンテンツの保守効率を高めました。', points: ['Sitemap', 'Meta Tags', 'Open Graph', '検索エンジンへの登録'] },
        { title: 'アクセス解析', body: 'サイトに Google Tag Manager と Google Analytics 4 を導入し、トラフィックとユーザー行動の計測を学びました。' },
        { title: 'アニメーションと体験', body: 'GSAP でページ遷移とインタラクションを作り、ブランドサイトのビジュアル体験を強化しました。', points: ['Page Transition', 'Scroll Animation', 'Responsive Layout'] },
      ],
      challenges: [
        { label: 'Search Optimization', title: 'SEO 構成の設計', problem: '個人サイトには、コンテンツの保守とページのパフォーマンスを保ちながら、検索で見つけてもらえることが求められます。', solution: 'Nuxt の SSR、メタ管理、サイトマップの作成により、検索エンジンのインデックス効率とサイトの露出を高めました。', tags: ['Nuxt SEO', 'Sitemap'] },
        { label: 'User Experience', title: 'ページ遷移の体験', problem: 'ページの切り替えがぎこちないと、閲覧体験全体が損なわれがちです。', solution: 'GSAP でページ遷移とアニメーションを作り、サイトのインタラクション性とブランドの印象を高めました。', tags: ['GSAP', 'Vue Transition'] },
        { label: 'Content Architecture', title: 'コンテンツ構成の設計', problem: '作品が増えるにつれ、共通のデータ構造がないと保守コストが上がり、レイアウトもばらつきやすくなります。', solution: 'Nuxt Content と Markdown でコンテンツ駆動の構成を作り、作品データを構造化して管理することで、同じテンプレートからすばやくページを生成できるようにしました。', tags: ['Nuxt Content', 'Markdown'] },
      ],
      verification: [
        'Google Search Console でサイトのインデックス状況と検索パフォーマンスを確認しました',
        '公開後、実際の操作で見つかったナビゲーションバーやハンバーガーメニューの遅延などの問題を修正しました',
        'GTM を自前で読み込むように変更した後、本番環境でカスタムイベントが GA4 に届くことを確認しました',
      ],
      retrospective: {
        learned: 'このサイトで初めて SEO とアクセス解析に実際に触れました。機能が完成したら終わりではなく、公開後にデータを見て初めて、訪問者がサイトを見つけて使ってくれているかがわかります。',
        next: 'Search Console でサービスページの検索パフォーマンスを継続的に確認し、結果に応じて内容を調整します。',
      },
    },
  },
  {
    slug: 'line-oa-platform', code: 'OA-04', accent: '#4CC38A', no: '04', kind: '業務システム 2026',
    tags: ['Vue 3', 'PrimeVue', 'Node.js', 'MongoDB', 'LINE Messaging API', 'SSE'],
    title: 'LINE 公式アカウント管理プラットフォーム',
    body: '店舗が LINE 公式アカウントの内容を自分で管理できる管理プラットフォームです。エンジニアに頼まなくても、FAQ、お知らせ、料金表を店舗自身で更新できます。',
    side: { icon: 'storefront', title: 'MANAGEMENT CAPABILITY', items: ['コンテンツ管理：FAQ、お知らせ、料金表', '複数店舗と権限の管理', 'リッチメニューのクリックと人気コンテンツの分析'] },
    detail: {
      period: '2026',
      role: '個人開発',
      diagram: {
        title: '管理画面の内容を LINE 公式アカウントへ同期',
        caption: 'プロジェクトの内容をもとに描いた概念図：店舗は管理画面で内容を編集し、LINE 公式アカウントに同期します。ユーザーのクリックは管理画面に戻り、分析に使われます。',
        nodes: [
          { id: 'admin', label: '店舗管理画面', sub: 'Vue 3, PrimeVue', x: 12, y: 30 },
          { id: 'api', label: 'Node.js API', sub: '複数店舗 / 権限', x: 40, y: 30 },
          { id: 'db', label: 'MongoDB', sub: 'FAQ・お知らせ・料金', x: 40, y: 56 },
          { id: 'line', label: 'LINE API', sub: 'Messaging API', x: 65, y: 30 },
          { id: 'oa', label: '公式アカウント利用者', x: 90, y: 30 },
          { id: 'stats', label: 'データ分析', sub: 'クリック・人気項目', x: 65, y: 6 },
        ],
        edges: [['admin', 'api', '内容を編集'], ['api', 'db'], ['api', 'line', '同期'], ['line', 'oa'], ['oa', 'stats', 'クリック記録'], ['stats', 'admin']],
      },
      headline: 'エンジニアに頼まなくても、店舗が自分で LINE 公式アカウントを更新できる。',
      overview: [
        'キャッテリー、ペットホテル、ペットサロン向けに作られ、店舗自身による更新と複数店舗の管理に対応しています。',
        'LINE 公式アカウントを運営する店舗によくある悩みは、同じ質問に何度も答えること、猫の情報の更新が大変なこと、お知らせがすぐ古くなること、そしてお客様がどのサービスに興味を持っているかわからないことです。',
      ],
      stack: [
        { group: 'frontend', items: ['Vue 3', 'PrimeVue'] },
        { group: 'backend', items: ['Node.js', 'LINE Messaging API', 'SSE'] },
        { group: 'database', items: ['MongoDB'] },
        { group: 'operations', items: ['Render', 'GitHub Actions', 'Cloudflare R2', 'Discord Webhook', 'Sentry'], why: 'いくつかのサービスを比較して Render を選びました。設定が簡単で、無料プランも小規模なサービスに合っています。ただし CPU とメモリが限られており、Sentry はバックエンドへの負荷が大きかったため、自作のログに切り替えました。' },
      ],
      features: [
        { title: 'コンテンツ管理', body: 'FAQ、お知らせ、料金表などの基本的なコンテンツは、すべて管理画面から自由に編集でき、開発作業は不要です。', points: ['FAQ', 'お知らせ', '料金表'] },
        { title: 'LINE 公式アカウントとの連携', body: '管理画面の内容を LINE 公式アカウントに同期し、一貫した最新の情報を届けます。' },
        { title: '複数店舗と権限の管理', body: 'チェーン店向けに設計されており、店舗ごとにサービスやデータを個別に設定できます。', },
        { title: 'リアルタイム通知', body: 'データの変更、予約の審査、新しいフォロワーなどのイベントを通知として保存し、SSE で管理画面にリアルタイムに届けます。ページを更新しなくても確認できます。店舗を切り替えると接続を張り直し、その店舗の通知だけを受け取ります。', points: ['SSE によるプッシュ', '既読 / 未読の管理', '店舗ごとに分離'] },
        { title: 'デプロイと運用', body: 'バックエンドは Render にデプロイし、自作の access log と audit log で本番の状況を追跡しています。GitHub Actions で定期的にバックアップし、結果は Discord に通知します。', points: ['Render', 'GitHub Actions', 'Cloudflare R2', 'Discord 通知'] },
        { title: 'データ分析', body: '店舗の LINE コンテンツの利用状況を追跡し、運営方針を改善するための根拠にします。', points: ['リッチメニューのクリック記録', '人気コンテンツのランキング', 'ユーザー行動の分析', 'クリック効果の集計'] },
      ],
      challenges: [
        { label: 'Observability', title: '監視ツールが LINE Bot の応答速度に影響', problem: 'バックエンドに Sentry を導入したところ、LINE Bot の応答が約 0.1〜0.2 秒から約 1 秒に遅くなりました。サービスは Render の無料プランで動いており、CPU もメモリも限られているため、監視ツールによる負荷が原因だと判断しました。', solution: 'まず profiling を、次に tracing を無効にしてエラー監視だけを残し、段階的に範囲を絞り込みました。最終的にバックエンドの Sentry を外し、自作の access log と audit log を console に出力して Render に収集させる方式に変更しました。フロントエンドでは Sentry を少しだけ使っています。', tags: ['Sentry', 'Logging', 'Performance'] },
        { label: 'Browser Compatibility', title: 'モバイル Safari でログイン後に Cookie が保存されない', problem: '管理画面は HttpOnly Cookie でログイン状態を保持しています。PC では問題なかったのに、スマートフォンでテストするとログインに成功しても未ログインのままでした。フロントエンドとバックエンドが別ドメインだったため、Cookie がサードパーティ Cookie とみなされ、Safari にブロックされていたのです。', solution: 'ドメインを調整してフロントエンドとバックエンドを同じメインドメインにしたことで、Cookie がサードパーティ扱いでなくなり、Safari でも正しく保存されるようになりました。', tags: ['Cookie', 'Safari'] },
        { label: 'Authentication', title: '複数のリクエストが同時に 401 になり連鎖的にログアウト', problem: 'Refresh Token は更新のたびにローテーションされます。Access Token の期限が切れると、ページ上の複数のリクエストが同時に /refresh を呼び、後から来たリクエストは古いトークンで拒否され、ログアウトが発生して CSRF Token まで消えていました。', solution: 'axios のインターセプターで refresh の Promise を共有し、同時に 1 回だけ更新して、他のリクエストはその結果を待ってから再試行するようにしました。', tags: ['JWT', 'CSRF', 'Axios'] },
      ],
      verification: [
        'Render にデプロイし、自作の access log と audit log を console に出力して、本番での実際のリクエストと重要な操作を追跡できるようにしました',
        'バックエンドは Sentry を外して自作のログに切り替え、フロントエンドでのみ Sentry を少し使っています',
        'GitHub Actions のスケジュールで毎日 MongoDB をバックアップし、監査ログを Cloudflare R2 にエクスポート、成功・失敗を Discord に通知しています',
        'セキュリティチェックを行い、アカウント管理の権限、ログイン、セッションの問題を修正しました',
        '複数タブでの CSRF と、複数のリクエストが同時に 401 になった場合のトークン更新フローを修正しました',
        '現時点では自動テストはなく、手動テストとログ監視が中心です',
      ],
      retrospective: {
        learned: '長期間動かすシステムでは、機能が完成したかどうかだけを見ていてはいけません。権限、CSRF、Webhook の署名、ログ、バックアップといった目に見えない部分こそが、システムを安定して動かす鍵になります。',
        next: 'ログイン、権限、予約の承認といった重要なフローに自動テストを追加し、変更時のリスクを下げます。',
      },
    },
  },
  {
    slug: 'weather-bike-bot', code: 'WB-05', accent: '#5AB8F0', no: '05', kind: 'LINE Bot 2024',
    tags: ['Node.js', 'Express', 'LINE Bot', 'Flex Message', 'API Integration'],
    title: '天気 & Bike ヘルパー',
    body: 'LINE のチャット画面で YouBike と天気の検索機能を統合し、リアルタイムのステーション情報と天気予報をすばやく確認できるようにしました。複数のアプリやサイトを行き来する手間が減ります。',
    side: { icon: 'pedal_bike', title: 'BOT CAPABILITY', items: ['YouBike ステーション検索（台数と空き）', '現在の天気、3 時間・3 日間・1 週間の予報', 'Flex Message とリッチメニューによる操作'] },
    detail: {
      role: '個人開発',
      diagram: {
        title: '複数の API をまとめるデータ変換レイヤー',
        caption: 'プロジェクトの内容をもとに描いた概念図：ソースや都市ごとに異なるデータを変換レイヤーで共通の形式にそろえ、Flex Message の返信にまとめます。',
        nodes: [
          { id: 'user', label: 'LINE ユーザー', sub: 'キーワード / メニュー', x: 10, y: 30 },
          { id: 'bot', label: 'Express Webhook', sub: 'LINE Bot SDK', x: 34, y: 30 },
          { id: 'norm', label: 'データ変換レイヤー', sub: '形式統一、エラー処理', x: 60, y: 30 },
          { id: 'bike', label: 'YouBike API', sub: '複数都市', x: 88, y: 12 },
          { id: 'cwa', label: '中央気象署 API', x: 88, y: 48 },
          { id: 'flex', label: 'Flex Message', x: 34, y: 56 },
        ],
        edges: [['user', 'bot', '検索'], ['bot', 'norm'], ['norm', 'bike'], ['norm', 'cwa'], ['norm', 'flex', '返信を作成'], ['flex', 'user']],
      },
      period: '2024',
      github: 'https://github.com/eliowei/linebot',
      headline: 'LINE で天気と YouBike の情報をすばやく確認。',
      stack: [
        { group: 'backend', items: ['Node.js', 'Express', 'LINE Bot SDK'] },
        { group: 'api', items: ['YouBike API', '中央気象署 API'] },
        { group: 'messaging', items: ['Flex Message', 'Rich Menu'] },
      ],
      features: [
        { title: 'YouBike ステーション検索', body: '近くの YouBike ステーションの情報を、貸出可能な台数と空きスペースを含めてすばやく取得できます。', points: ['ステーション検索', '台数の表示', '空きの表示', '複数都市に対応'] },
        { title: '天気予報の検索', body: '現在の天気とこの先の予報を調べられ、通勤や外出の計画に役立ちます。', points: ['現在の天気', '3 時間予報', '3 日間予報', '1 週間予報'] },
        { title: 'LINE での操作体験', body: 'Flex Message とリッチメニューで、より直感的なチャット形式の操作を提供します。', points: ['キーワード', 'リッチメニュー', 'Flex Message', '画像付きメッセージ'] },
      ],
      challenges: [
        { label: 'Data Integration', title: '複数のサードパーティ API の統合', problem: 'YouBike と中央気象署の API はデータ形式もフィールドの定義も異なり、そのまま使うと後々の保守コストが上がります。また、API リクエストの失敗やデータの異常も考慮する必要がありました。', solution: 'データ変換レイヤーを作ってデータ構造と返却形式を統一し、エラー処理も加えることで、システムの安定性と保守性を高めました。', tags: ['Node.js', 'Express'] },
        { label: 'User Experience', title: 'チャットフローの設計', problem: 'ウェブサイトのようにナビゲーションバーで操作できないため、機能が多すぎると覚えるのが大変になります。', solution: 'リッチメニューとキーワードによるフローを設計し、Flex Message で情報を表示することで、よりわかりやすい操作体験にしました。', tags: ['LINE Bot SDK', 'Flex Message'] },
        { label: 'Data Normalization', title: '複数都市のデータ統合', problem: '都市ごとに YouBike API の構造やデータ形式が異なり、データ処理と保守が難しくなっていました。', solution: '共通のデータ形式と変換ロジックを作り、異なるソースのデータを同じ構造に整えることで、今後の機能追加をしやすくしました。', tags: ['Node.js', 'API Integration'] },
      ],
      verification: [
        '小さなスクリプトを書いて YouBike と天気の API を実際に呼び出し、返却されるデータ形式を確認しました',
        'LINE でキーワードとリッチメニューを操作し、返信内容を確認しました',
        '現時点では自動テストはなく、手動テストが中心です',
      ],
      retrospective: {
        learned: 'ソースごとにデータの形式はまちまちです。先に共通の形式に変換しておけば、その後の返信ロジックはずっとシンプルになります。',
        next: 'データ変換レイヤーにテストを追加し、外部 API が失敗したときにユーザーへ案内を表示できるようにします。',
      },
    },
  },
]

export const contact: typeof zh.contact = {
  eyebrow: 'お問い合わせ',
  title: 'お気軽にご連絡ください。',
  body: '新しいフロントエンドの仕事の機会を探しています。Vue に慣れていて、問題の根本原因まで追いかけるフロントエンドエンジニアをお探しでしたら、ぜひご連絡ください。',
}

// スクリーンショットのキャプション。data/project-images.ts の中国語キャプションをキーにしています。
export const captions: Record<string, string> = {
  '首頁：封面、天氣與當日行程': 'ホーム：カバー、天気、当日の旅程',
  '行程詳情：交通、地圖與景點資訊': '旅程の詳細：交通、地図、観光スポット',
  '旅遊資訊：即時資訊與行前準備': '旅行情報：リアルタイム情報と出発前の準備',
  '旅遊資訊：行李清單': '旅行情報：持ち物リスト',
  '旅遊資訊：迪士尼樂園規劃（示意資料）': '旅行情報：ディズニーランドの計画（サンプルデータ）',
  '旅遊資訊：迪士尼行程地圖（示意資料）': '旅行情報：ディズニーのルートマップ（サンプルデータ）',
  'AI 旅遊助手': 'AI 旅行アシスタント',
  '花費紀錄（示意資料）': '支出記録（サンプルデータ）',
  '揪團首頁': '募集トップ',
  '搜尋功能': '検索機能',
  '揪團詳情': '募集の詳細',
  '聊天室': 'チャットルーム',
  '主辦揪團管理': '主催する募集の管理',
  '個人資料管理': 'プロフィール管理',
  '首頁 Hero': 'ホームのヒーロー',
  'Case Study 列表': 'ケーススタディ一覧',
  '作品詳情': '作品の詳細',
  'LINE 官方帳號首頁': 'LINE 公式アカウントのホーム',
  '系統資訊總覽': 'システム情報の概要',
  '貓咪管理': '猫の管理',
  '公告管理': 'お知らせ管理',
  '功能選單': 'リッチメニュー',
  'YouBike 查詢': 'YouBike 検索',
  'YouBike 位置分享查詢': '位置情報による YouBike 検索',
  '天氣預報': '天気予報',
  '天氣預報查詢': '天気予報の検索',
}
