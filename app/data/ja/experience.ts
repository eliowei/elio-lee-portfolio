// data/experience.ts の日本語版。
import type * as zh from '../experience'

export const intro: typeof zh.intro = {
  eyebrow: '経歴',
  title: 'UI の実装からエンジニアリング品質まで、積み重ねてきたこと。',
  body: 'これまでの職務経験、活用してきた技術、開発の中で身につけたエンジニアリングへの理解をまとめています。',
  pills: [
    { icon: 'domain', color: 'text-primary', label: 'RollingStar Survey Technology Limited フロントエンドエンジニア' },
    { icon: 'school', color: 'text-primary', label: '健行科技大学 情報管理学科' },
    { icon: 'layers', color: 'text-primary', label: 'Vue 2 / Vue 3 & Vuetify プロジェクト' },
    { icon: 'accessibility_new', color: 'text-primary', label: 'アクセシビリティ改修と NVDA での検証' },
    { icon: 'map', color: 'text-secondary', label: 'OpenLayers による地理空間データ' },
    { icon: 'code', color: 'text-tertiary-container', label: 'データフローの追跡と注文フローの拡張' },
  ],
}

export const roles: typeof zh.roles = [
  {
    no: '01',
    dot: 'primary',
    badge: '正社員',
    period: '2025/04 — 現在',
    place: 'RollingStar Survey Technology Limited',
    title: 'フロントエンドエンジニア ｜ RollingStar Survey Technology Limited',
    summary: '社内システムのフロントエンド開発と保守を担当し、UI 開発、既存の問題の調査、機能の拡張を行っています。',
    tagIcon: 'explore',
    tagLabel: 'GIS / Web Frontend',
    stack: [
      { label: 'Vue 2', primary: true }, { label: 'Vue 3', primary: true }, { label: 'Vuetify 2', primary: true },
      { label: 'Vuetify 3', primary: true }, { label: 'JavaScript' }, { label: 'OpenLayers' },
    ],
    listTitle: '主な業務と開発のポイント',
    listIcon: 'task_alt',
    items: [
      { title: 'Vue 2 と Vue 3 プロジェクトの開発・保守', body: '社内には Vue 2 と Vue 3 のプロジェクトがあり、いずれも Options API で書かれています。Dialog、Menu、フォームバリデーションなどのコンポーネントの挙動やスタイルの問題に対応しています。' },
      { title: 'アクセシビリティ検査の指摘対応', body: 'サイトのアクセシビリティ検査で差し戻された箇所の修正を引き継ぎ、見出し構造、キーボード操作、フォームのラベル、スキップリンク、アクセスキーに対応して、A 等級の検査合格に貢献しました。' },
      { title: '既存コードの不具合の追跡', body: '既存コード自体の不具合によるエラーに対しては、データフローと業務ロジックを実際に追って根本原因を突き止めてから修正し、JavaScript のプロトタイプチェーンを活かして書き方を見直しました。表面的な症状だけを処理することはしません。' },
      { title: '注文フローの拡張', body: '注文フロー全体を拡張しました。まずコードから既存機能を理解し、次にユーザーの視点から操作手順を調整して、より直感的なフローにしました。' },
      { title: 'ユーザー視点での要件の補完', body: '管理画面の CRUD 機能の要件を受けたとき、自分から画像のプレビューと拡大表示を加え、管理者がダウンロードせずに内容を確認できるようにしました。' },
      { title: 'OpenLayers による地理空間データ', body: '測量システムにおける OpenLayers の活用を理解し、地図レイヤーとフロントエンドの UI の統合を支援し、要件に応じて関連パラメーターを調整しています。' },
    ].map(i => ({ ...i, icon: 'check_circle' })),
    highlight: {
      icon: 'accessibility_new',
      title: '事例：日付ピッカーのアクセシビリティを補う',
      body: 'Vue 3 プロジェクトをアクセシビリティ基準に沿って改修する中で、Vuetify の日付ピッカーはキーボード操作と読み上げへの対応が不十分だとわかりました。共通の mixin を作って矢印キーでの操作、フォーカス管理、日付の読み上げラベルを追加し、複数のフォームに適用したうえで、NVDA で読み上げが正しいことを確認しました。',
    },
  },
  {
    no: '02',
    dot: 'secondary',
    badge: '職業訓練 ソフトウェア開発',
    period: '2024/09 — 2025/03',
    place: '泰山職業訓練センター',
    title: 'フロントエンド Web 開発研修 ｜ 泰山職業訓練センター',
    summary: '約半年間のフロントエンド Web 開発研修を修了しました。Web の基礎から Vue のコンポーネント開発、フロントエンドとバックエンドの統合まで学び、Web サイト開発の基礎を一通り身につけました。',
    tagIcon: 'school',
    tagLabel: 'フルスタックの基礎固め',
    stack: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Vue.js', 'Vuetify', 'Node.js', 'Express', 'MongoDB', 'Git']
      .map(label => ({ label, primary: ['HTML', 'CSS', 'JavaScript', 'Vue.js', 'Vuetify'].includes(label) })),
    listTitle: '主な学習内容と実践のポイント',
    listIcon: 'auto_stories',
    items: [
      { title: 'フロントエンドの基礎とインタラクション', body: 'HTML、CSS、JavaScript、jQuery、レスポンシブデザインを学び、実践を通じてページの構造、スタイル、インタラクションのロジックに慣れました。' },
      { title: 'Vue によるコンポーネント開発', body: 'Vue.js と Vuetify を学び、コンポーネントの分割、データの受け渡し、UI の組み立て方を理解しました。' },
      { title: 'バックエンドとデータベースの基礎', body: 'Node.js、Express、MongoDB、RESTful API に触れ、フロントエンドとバックエンドのデータのやり取りと基本的なデータ操作を理解しました。' },
      { title: 'プロジェクト開発の全工程', body: '要件の発想、Figma でのビジュアルデザイン、マインドマップ、サイトマップ、データベース設計から、フロントエンドとバックエンドの開発、サイトのデプロイまで、プロジェクトの全工程に携わりました。' },
    ].map(i => ({ ...i, icon: 'check_circle' })),
    highlight: {
      icon: 'group_work',
      title: '卒業制作：ゲーム仲間募集サイト',
      body: 'ゲーマーの仲間探しのニーズを出発点に、フロントエンドとバックエンドを統合したサイトを開発しました。フロントエンドは Vue と Vuetify で UI を構築し、バックエンドは Node.js と Express で API を開発、MongoDB でデータを保存・操作して、機能の統合とデプロイまで完了させました。',
    },
  },
  {
    no: '03',
    dot: 'outline',
    badge: '軍務 常勤',
    period: '2017/12 — 2023/12',
    place: '陸軍第 21 砲兵指揮部',
    title: '志願兵 ｜ 陸軍第六軍団第二一砲兵指揮部',
    summary: '6 年間の服務期間中、主に軍用車両の整備と検査を担当しました。',
    tagIcon: 'shield',
    tagLabel: '規律と実行力',
    listTitle: '主な業務と身につけた力',
    listIcon: 'fact_check',
    items: [
      { icon: 'build', title: '軍用車両の整備と検査', body: '作業規定に従って車両の状態を一項目ずつ点検し、故障の原因を判断してから整備を行いました。' },
      { icon: 'assignment_turned_in', title: '任務の遂行', body: '任務の要件に応じて作業の進行を組み立て、期限どおりに完了させました。' },
      { icon: 'groups', title: 'チームでの協働', body: 'チームでの役割分担と決められた手順のもとで任務を遂行し、責任感と規律を身につけました。' },
    ],
    quote: '6 年間の整備・検査の仕事で、まず規定に沿って点検し、問題の根本原因を見つけてから手を動かす習慣が身につきました。この習慣はフロントエンド開発にも生きています。エラーが起きたら、まず原因と影響範囲を調べてから、どう修正するかを決めます。',
  },
]

export const transitions: typeof zh.transitions = [
  {
    after: '03',
    title: '軍務を離れ、あらためてプログラミングへ',
    body: ['退役後、次のキャリアの方向を考え始めました。子どもの頃からプログラミングに興味があったので、泰山職業訓練センターの研修であらためてプログラミングに取り組むことにし、HTML、CSS、JavaScript などのフロントエンドの基礎から、Web 開発の知識と実践力を少しずつ身につけていきました。'],
  },
  {
    after: '02',
    title: '卒業制作から、実際のソフトウェア開発へ',
    body: [
      '研修中の卒業制作を通じて、要件の計画、UI デザインからフロントエンドとバックエンドの統合までを実践し、それを足がかりに初めてフロントエンドエンジニアとしての職を得ました。',
      '業界に入ってからは、実際のソフトウェア開発の流れをより深く理解するようになり、授業での学びと実務の違いにも気づいていきました。機能開発、問題の調査、既存システムの保守と調整を通じて経験を積み、実際のプロジェクトで機能要件、保守性、ユーザー体験を両立させる方法を学び続けています。',
    ],
  },
]

export const matrix: typeof zh.matrix = {
  eyebrow: 'Tech Stack & Practice',
  title: '技術と実際の活用',
  body: '会社のプロジェクトと個人プロジェクトで実際に使った技術と、その使いどころをまとめました。',
  heads: ['技術領域', '技術とツール', '実際の活用', '経験の場'],
  rows: [
    { icon: 'devices', domain: 'フロントエンドフレームワーク', stack: 'Vue 2 / Vue 3, JavaScript, TypeScript', scope: '会社の Vue 2・Vue 3 プロジェクトは Options API で記述。個人プロジェクトでは Composition API と TypeScript を使用', source: '会社＋個人' },
    { icon: 'brush', domain: 'UI ライブラリとスタイル調整', stack: 'Vuetify 2 / Vuetify 3, CSS / SASS', scope: 'Dialog・Menu のオーバーレイ位置、フォームバリデーション、CSS の上書き、レスポンシブレイアウトの修正', source: '会社のプロジェクト' },
    { icon: 'accessibility_new', domain: 'アクセシビリティ', stack: 'JavaScript, NVDA', scope: 'アクセシビリティ基準に沿って Vue 3 の UI を改修し、共通の mixin で日付ピッカーのキーボード操作、フォーカス管理、読み上げラベルを補い、NVDA で読み上げを実機確認', source: '会社のプロジェクト' },
    { icon: 'map', domain: '地理空間マップ', stack: 'OpenLayers', scope: '地図レイヤーとフロントエンドの UI の統合を支援し、要件に応じて関連パラメーターを調整', source: '会社のプロジェクト' },
    { icon: 'hub', domain: 'フルスタックへの展開', stack: 'Vue 3, PrimeVue, Node.js, MongoDB, LINE Messaging API', scope: '友人のために LINE 公式アカウントのボットを開発し、管理画面とデータベースまで広げて、店舗が管理画面から LINE 公式アカウントの表示内容を変更できるようにした', source: '個人プロジェクト' },
    { icon: 'build', domain: 'ビルドとバージョン管理', stack: 'Vite, Webpack, Git, GitLab', scope: 'Lighthouse で JS ファイルが大きすぎると指摘されたため、ビルド時の chunk 分割を調整。個人開発で、AI が生成したコードを Merge Request のフローでレビュー', source: '実務経験' },
    { icon: 'api', domain: 'API 連携と UI の調査', stack: 'Postman, Axios, Chrome DevTools', scope: 'バックエンド API の検証、Payload 形式のすり合わせ、Console と Network パネルでの問題の追跡', source: '会社のプロジェクト' },
  ],
}

export const principlesSection: typeof zh.principlesSection = {
  eyebrow: 'Engineering Insights',
  title: '仕事の中で積み重ねた技術',
  body: 'プロジェクトの開発と保守の中で、少しずつ身についた 3 つの働き方です。',
}

export const principles: typeof zh.principles = [
  { icon: 'compare', title: 'フレームワークの違いを分析する', body: 'Vue 2 と Vue 3 の両方のプロジェクトに関わる中で、バージョンごとのコンポーネント API、デフォルトの挙動、スタイルの違いを理解し、一方の書き方をそのままもう一方に当てはめないようにしています。', foot: 'Framework Behavior Analysis' },
  { icon: 'troubleshoot', title: '問題の根本まで追う', body: '問題の再現から始め、データフローと業務ロジックを追って、原因が既存コードの不具合なのか、イベントの伝播、ライフサイクルの順序、CSS の重なりなのかを見極め、修正後に結果を検証します。', foot: 'Root Cause Debugging' },
  { icon: 'person_search', title: 'ユーザー視点で要件を補う', body: '要件を受けたら、仕様を満たすだけでなく実際の利用場面も考えます。たとえば管理画面の CRUD に画像のプレビューと拡大を加えたり、注文フローを拡張するときに操作をより直感的にしたりしました。', foot: 'User-Centered Development' },
]

export const cta: typeof zh.cta = {
  badge: 'お問い合わせ',
  title: 'もう少し話してみませんか？',
  body: '経歴をご覧になって、さらに知りたいことがあれば、お気軽にメッセージをお送りください。',
}
