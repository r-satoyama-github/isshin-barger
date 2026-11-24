// ===============================================
//  Isshin Barger メニュー設定
//  ここを書きかえると、お店の名前や商品・値段を変えられます。
// ===============================================

export const SHOP = {
  name: 'Isshin Barger',          // 画面に表示する店名
  yomi: 'いっしんバーガー',          // 読み上げるときの読み方
  catchCopy: 'おいしい えがおを とどけます',
};

// カテゴリ（タブ）
export const CATEGORIES = [
  { id: 'burger',  name: 'バーガー', emoji: '🍔', color: '#ff8a3d' },
  { id: 'set',     name: 'セット',   emoji: '🎁', color: '#e63b2e' },
  { id: 'side',    name: 'サイド',   emoji: '🍟', color: '#f2b705' },
  { id: 'drink',   name: 'ドリンク', emoji: '🥤', color: '#2fa4e7' },
  { id: 'dessert', name: 'デザート', emoji: '🍦', color: '#e85a9b' },
];

// 商品
//  price: 値段（えん）
//  sizes: サイズがある商品は { S: 値段, M: 値段, L: 値段 }
export const ITEMS = [
  // バーガー
  { id: 'hamburger', cat: 'burger', name: 'ハンバーガー',     emoji: '🍔',   price: 200 },
  { id: 'cheese',    cat: 'burger', name: 'チーズバーガー',   emoji: '🧀🍔', price: 250 },
  { id: 'teriyaki',  cat: 'burger', name: 'テリヤキバーガー', emoji: '🍯🍔', price: 300 },
  { id: 'chicken',   cat: 'burger', name: 'チキンバーガー',   emoji: '🐔🍔', price: 280 },
  { id: 'fish',      cat: 'burger', name: 'フィッシュバーガー', emoji: '🐟🍔', price: 280 },
  { id: 'big',       cat: 'burger', name: 'ビッグバーガー',   emoji: '🍔🍔', price: 400 },

  // サイド
  { id: 'potato',  cat: 'side', name: 'ポテト',         emoji: '🍟', price: 150 },
  { id: 'nugget',  cat: 'side', name: 'チキンナゲット', emoji: '🍗', price: 200 },
  { id: 'salad',   cat: 'side', name: 'サラダ',         emoji: '🥗', price: 180 },
  { id: 'corn',    cat: 'side', name: 'コーン',         emoji: '🌽', price: 120 },

  // ドリンク（サイズあり）
  { id: 'orange', cat: 'drink', name: 'オレンジジュース', emoji: '🍊', sizes: { S: 100, M: 150, L: 200 } },
  { id: 'cola',   cat: 'drink', name: 'コーラ',           emoji: '🥤', sizes: { S: 100, M: 150, L: 200 } },
  { id: 'melon',  cat: 'drink', name: 'メロンソーダ',     emoji: '🍈', sizes: { S: 100, M: 150, L: 200 } },
  { id: 'milk',   cat: 'drink', name: 'ミルク',           emoji: '🥛', sizes: { S: 100, M: 150, L: 200 } },

  // デザート
  { id: 'softcream', cat: 'dessert', name: 'ソフトクリーム', emoji: '🍦', price: 100 },
  { id: 'applepie',  cat: 'dessert', name: 'アップルパイ',   emoji: '🥧', price: 150 },
  { id: 'pancake',   cat: 'dessert', name: 'パンケーキ',     emoji: '🥞', price: 250 },
  { id: 'donut',     cat: 'dessert', name: 'ドーナツ',       emoji: '🍩', price: 120 },
];

// セット = えらんだバーガー ＋ ポテト ＋ ドリンク(M)  から discount えん びき
export const SET = {
  sideId: 'potato',
  drinkSize: 'M',
  discount: 100,
};

// おかいけいで つかう おかね
export const MONEY = [1000, 500, 100, 50, 10];
