export const COLORS = [
  '#ff5a36', '#ffb800', '#2bd9a0', '#3d8bff',
  '#b26bff', '#ff4fa3', '#19c6d9', '#8bd62b',
];
// Sticker avatars offered on the join screen: id -> DiceBear "fun-emoji" eyes/mouth (all happy faces).
export const STICKER_FACES = {
  sunny:   { eyes: 'stars',   mouth: 'smileLol' },
  mochi:   { eyes: 'closed',  mouth: 'wideSmile' },
  peach:   { eyes: 'love',    mouth: 'smileTeeth' },
  cosmo:   { eyes: 'shades',  mouth: 'smileTeeth' },
  pip:     { eyes: 'cute',    mouth: 'lilSmile' },
  bean:    { eyes: 'wink',    mouth: 'tongueOut' },
  boop:    { eyes: 'wink2',   mouth: 'wideSmile' },
  fizz:    { eyes: 'closed2', mouth: 'smileLol' },
  pudding: { eyes: 'stars',   mouth: 'wideSmile' },
  gizmo:   { eyes: 'glasses', mouth: 'wideSmile' },
  sprout:  { eyes: 'plain',   mouth: 'smileTeeth' },
  taffy:   { eyes: 'glasses', mouth: 'tongueOut' },
  blip:    { eyes: 'stars',   mouth: 'tongueOut' },
  nugget:  { eyes: 'shades',  mouth: 'tongueOut' },
  jelly:   { eyes: 'closed',  mouth: 'kissHeart' },
  waffle:  { eyes: 'plain',   mouth: 'tongueOut' },
  pixel:   { eyes: 'wink',    mouth: 'kissHeart' },
  cocoa:   { eyes: 'closed2', mouth: 'tongueOut' },
  ziggy:   { eyes: 'wink2',   mouth: 'lilSmile' },
  muffin:  { eyes: 'cute',    mouth: 'smileLol' },
  poppy:   { eyes: 'love',    mouth: 'lilSmile' },
  biscuit: { eyes: 'wink2',   mouth: 'smileTeeth' },
  doodle:  { eyes: 'love',    mouth: 'tongueOut' },
  zigzag:  { eyes: 'cute',    mouth: 'wideSmile' },
};
export const STICKERS = Object.keys(STICKER_FACES);
export const DEFAULT_STICKER = 'pip';
export const EMOJI = [
  '😀','😂','🥹','😍','😎','🤔','😭','🥳',
  '👍','👎','👏','🙌','🙏','💪','👀','🔥',
  '❤️','💜','💚','💯','✨','🎉','🚀','⭐',
  '☕','🍕','🍿','🎧','🎮','🌈','🌙','☀️',
  '🐱','🐶','🦊','🐙','🌵','🍀','⚡','💡',
];
export const MAX_LEN = 1000;
