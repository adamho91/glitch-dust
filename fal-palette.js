// Shared fal tonal palette — sourced from the main Glitch Dust builder.
const BG_COLOR_OPTIONS = [
  { value: 'transparent', label: 'Transparent' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#E5ECE7', label: 'Light sage' },
  { value: '#D9D7CC', label: 'Lt brown' },
  { value: '#96AFAC', label: 'Sage' },
  { value: '#004012', label: 'Dark green' },
  { value: '#403700', label: 'Olive' },
  { value: '#3D5A00', label: 'Dark lime' },
  { value: '#ADFF00', label: 'Chartreuse' },
  { value: '#C8FF66', label: 'Lt lime' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#115EF3', label: 'Royal blue' },
  { value: '#3FB5FE', label: 'Baby blue' },
  { value: '#C5E9FF', label: 'Light blue' },
  { value: '#99EDFF', label: 'Turquoise' },
  { value: '#5718C0', label: 'Dark purple' },
  { value: '#AB77FF', label: 'Purple' },
  { value: '#D5BBFF', label: 'Light purple' },
  { value: '#FFC4D8', label: 'Light pink' },
  { value: '#F57EC3', label: 'Pink' },
  { value: '#EC0648', label: 'Red' },
  { value: 'custom', label: 'Custom' },
];

const FAL_2 = [
  { id: '2-a', label: '2-A · Cyan / Lime',     colors: ['#99EDFF', '#ADFF00'], bg: '#99EDFF' },
  { id: '2-b', label: '2-B · Pink / Red',        colors: ['#FFC4D8', '#EC0648'], bg: '#FFC4D8' },
  { id: '2-c', label: '2-C · Green / Cyan',      colors: ['#004012', '#99EDFF'], bg: '#004012' },
  { id: '2-d', label: '2-D · Olive / Cyan',      colors: ['#403700', '#99EDFF'], bg: '#403700' },
  { id: '2-e', label: '2-E · Yellow / Black',    colors: ['#FFFF00', '#000000'], bg: '#FFFF00' },
  { id: '2-f', label: '2-F · Sage / Lime',     colors: ['#96AFAC', '#ADFF00'], bg: '#96AFAC' },
  { id: '2-g', label: '2-G · Lime / Red',      colors: ['#ADFF00', '#EC0648'], bg: '#ADFF00' },
  { id: '2-h', label: '2-H · Green / Red',       colors: ['#004012', '#EC0648'], bg: '#004012' },
  { id: '2-i', label: '2-I · Green / Lime',      colors: ['#004012', '#ADFF00'], bg: '#004012' },
  { id: '2-j', label: '2-J · Olive / Lime',      colors: ['#403700', '#ADFF00'], bg: '#403700' },
  { id: '2-k', label: '2-K · Lime / Pink',   colors: ['#C8FF66', '#FFC4D8'], bg: '#C8FF66' },
  { id: '2-l', label: '2-L · Olive / Lt brown',  colors: ['#403700', '#D9D7CC'], bg: '#403700' },
  { id: '2-m', label: '2-M · Lt blue / Royal',   colors: ['#C5E9FF', '#115EF3'], bg: '#C5E9FF' },
  { id: '2-n', label: '2-N · White / Red',       colors: ['#FFFFFF', '#EC0648'], bg: '#FFFFFF' },
  { id: '2-o', label: '2-O · Sage / Brown',      colors: ['#E5ECE7', '#403700'], bg: '#E5ECE7' },
  { id: '2-p', label: '2-P · Royal / Cyan',      colors: ['#115EF3', '#99EDFF'], bg: '#115EF3' },
  { id: '2-q', label: '2-Q · Red / Pink',        colors: ['#EC0648', '#FFC4D8'], bg: '#EC0648' },
  { id: '2-r', label: '2-R · Black / White',     colors: ['#000000', '#FFFFFF'], bg: '#000000' },
  { id: '2-s', label: '2-S · Black / Lime',      colors: ['#000000', '#ADFF00'], bg: '#000000' },
  { id: '2-t', label: '2-T · Black / Pink',      colors: ['#000000', '#F57EC3'], bg: '#000000' },
  { id: '2-u', label: '2-U · Olive / Yellow',    colors: ['#403700', '#FFFF00'], bg: '#403700' },
  { id: '2-v', label: '2-V · Lt lime / Green',   colors: ['#C8FF66', '#004012'], bg: '#C8FF66' },
  { id: '2-w', label: '2-W · Baby blue / Blue',  colors: ['#3FB5FE', '#115EF3'], bg: '#C5E9FF' },
  { id: '2-x', label: '2-X · Yellow / Blue',     colors: ['#FFFF00', '#115EF3'], bg: '#FFFF00' },
  { id: '2-y', label: '2-Y · Teal / Lt blue',    colors: ['#004012', '#C5E9FF'], bg: '#004012' },
  { id: '2-z', label: '2-Z · Pink / White',      colors: ['#F57EC3', '#FFFFFF'], bg: '#F57EC3' },
  { id: '2-aa', label: '2-AA · Dark purple / Lt purple', colors: ['#5718C0', '#D5BBFF'], bg: '#5718C0' },
  { id: '2-ab', label: '2-AB · Dark purple / Lime', colors: ['#5718C0', '#ADFF00'], bg: '#5718C0' },
  { id: '2-ac', label: '2-AC · Purple / White', colors: ['#AB77FF', '#FFFFFF'], bg: '#5718C0' },
  { id: '2-ad', label: '2-AD · Lt purple / Dark purple', colors: ['#D5BBFF', '#5718C0'], bg: '#D5BBFF' },
  { id: '2-ae', label: '2-AE · Black / Purple', colors: ['#000000', '#AB77FF'], bg: '#000000' },
  { id: '2-af', label: '2-AF · Dark purple / Cyan', colors: ['#5718C0', '#99EDFF'], bg: '#5718C0' },
];

const FAL_5 = [
  { id: '5-a', label: '5-A · Olive + accents',   colors: ['#99EDFF', '#115EF3', '#C8FF66', '#ADFF00'], bg: '#403700' },
  { id: '5-b', label: '5-B · Pink + accents',    colors: ['#C8FF66', '#FFFFFF', '#EC0648', '#ADFF00'], bg: '#FFC4D8' },
  { id: '5-c', label: '5-C · Cyan + accents',    colors: ['#FFFF00', '#C8FF66', '#115EF3', '#FFFFFF'], bg: '#99EDFF' },
  { id: '5-d', label: '5-D · White + accents',   colors: ['#115EF3', '#FFFF00', '#ADFF00', '#C8FF66'], bg: '#FFFFFF' },
  { id: '5-e', label: '5-E · Sage + accents',    colors: ['#403700', '#ADFF00', '#FFFF00', '#115EF3'], bg: '#E5ECE7' },
  { id: '5-f', label: '5-F · Royal + accents',   colors: ['#FFFFFF', '#99EDFF', '#FFFF00', '#ADFF00'], bg: '#115EF3' },
  { id: '5-g', label: '5-G · Black + accents',   colors: ['#ADFF00', '#F57EC3', '#FFFFFF', '#99EDFF'], bg: '#000000' },
  { id: '5-h', label: '5-H · Lt blue + accents', colors: ['#115EF3', '#FFFF00', '#EC0648', '#ADFF00'], bg: '#C5E9FF' },
  { id: '5-i', label: '5-I · Green + accents',   colors: ['#C8FF66', '#FFFF00', '#99EDFF', '#ADFF00'], bg: '#004012' },
  { id: '5-j', label: '5-J · Red + accents',     colors: ['#FFFFFF', '#FFC4D8', '#FFFF00', '#115EF3'], bg: '#EC0648' },
  { id: '5-k', label: '5-K · Yellow + accents',  colors: ['#115EF3', '#EC0648', '#000000', '#ADFF00'], bg: '#FFFF00' },
  { id: '5-l', label: '5-L · Lt pink + accents', colors: ['#EC0648', '#99EDFF', '#115EF3', '#FFFF00'], bg: '#FFC4D8' },
  { id: '5-m', label: '5-M · Olive / yellow',    colors: ['#FFFF00', '#ADFF00', '#D9D7CC', '#EC0648'], bg: '#403700' },
  { id: '5-n', label: '5-N · Teal / cyan',       colors: ['#99EDFF', '#C5E9FF', '#C8FF66', '#FFFFFF'], bg: '#004012' },
  { id: '5-o', label: '5-O · Hot pink + lime',   colors: ['#ADFF00', '#FFFFFF', '#115EF3', '#FFFF00'], bg: '#F57EC3' },
  { id: '5-p', label: '5-P · White / multi',     colors: ['#115EF3', '#EC0648', '#ADFF00', '#403700'], bg: '#FFFFFF' },
  { id: '5-q', label: '5-Q · Dark purple + accents', colors: ['#AB77FF', '#D5BBFF', '#ADFF00', '#FFFFFF'], bg: '#5718C0' },
  { id: '5-r', label: '5-R · Lt purple + accents', colors: ['#5718C0', '#AB77FF', '#ADFF00', '#FFFFFF'], bg: '#D5BBFF' },
  { id: '5-s', label: '5-S · Black + purple', colors: ['#5718C0', '#AB77FF', '#D5BBFF', '#ADFF00'], bg: '#000000' },
];

const FAL_3 = [
  { id: '3-a', label: '3-A · Olive / cyan / lime',   colors: ['#99EDFF', '#ADFF00', '#C8FF66'], bg: '#403700' },
  { id: '3-b', label: '3-B · Pink / white / red',    colors: ['#FFFFFF', '#EC0648', '#ADFF00'], bg: '#FFC4D8' },
  { id: '3-c', label: '3-C · Cyan / blue / yellow',  colors: ['#115EF3', '#FFFF00', '#FFFFFF'], bg: '#99EDFF' },
  { id: '3-d', label: '3-D · White / blue / lime',   colors: ['#115EF3', '#ADFF00', '#C8FF66'], bg: '#FFFFFF' },
  { id: '3-e', label: '3-E · Lt blue / royal / yellow', colors: ['#115EF3', '#3FB5FE', '#FFFF00'], bg: '#C5E9FF' },
  { id: '3-f', label: '3-F · Sage / brown / lime',   colors: ['#403700', '#ADFF00', '#FFFF00'], bg: '#E5ECE7' },
  { id: '3-g', label: '3-G · Royal / white / cyan',  colors: ['#FFFFFF', '#99EDFF', '#FFFF00'], bg: '#115EF3' },
  { id: '3-h', label: '3-H · Black / lime / pink',   colors: ['#ADFF00', '#F57EC3', '#FFFFFF'], bg: '#000000' },
  { id: '3-i', label: '3-I · Green / lime / yellow', colors: ['#ADFF00', '#FFFF00', '#C8FF66'], bg: '#004012' },
  { id: '3-j', label: '3-J · Red / pink / white',    colors: ['#FFC4D8', '#FFFFFF', '#FFFF00'], bg: '#EC0648' },
  { id: '3-k', label: '3-K · Yellow / blue / red',   colors: ['#115EF3', '#EC0648', '#000000'], bg: '#FFFF00' },
  { id: '3-l', label: '3-L · Olive / yellow / pink', colors: ['#FFFF00', '#F57EC3', '#99EDFF'], bg: '#403700' },
  { id: '3-m', label: '3-M · Lt pink / red / cyan',  colors: ['#EC0648', '#99EDFF', '#FFFF00'], bg: '#FFC4D8' },
  { id: '3-n', label: '3-N · Teal / cyan / lime',    colors: ['#99EDFF', '#C8FF66', '#FFFF00'], bg: '#004012' },
  { id: '3-o', label: '3-O · Black / white / blue',  colors: ['#FFFFFF', '#115EF3', '#ADFF00'], bg: '#000000' },
  { id: '3-p', label: '3-P · Baby blue / royal / pink', colors: ['#115EF3', '#F57EC3', '#FFFF00'], bg: '#C5E9FF' },
  { id: '3-q', label: '3-Q · Purple ramp', colors: ['#5718C0', '#AB77FF', '#D5BBFF'], bg: '#5718C0' },
  { id: '3-r', label: '3-R · Dark purple / lime / white', colors: ['#ADFF00', '#FFFFFF', '#D5BBFF'], bg: '#5718C0' },
  { id: '3-s', label: '3-S · Dark purple / cyan / lime', colors: ['#99EDFF', '#ADFF00', '#AB77FF'], bg: '#5718C0' },
  { id: '3-t', label: '3-T · Lt purple / purple / black', colors: ['#AB77FF', '#5718C0', '#000000'], bg: '#D5BBFF' },
];

const FAL_4 = FAL_5.map(p => ({
  id: p.id.replace('5', '4'),
  label: p.label.replace(/^5-/, '4-'),
  colors: p.colors.slice(0, 4),
  bg: p.bg,
  group: p.group,
}));

const TONAL_BY_COUNT = { 2: FAL_2, 3: FAL_3, 4: FAL_4, 5: FAL_5 };

const FAL_BRAND_PALETTE = [
  { id: 'purple', label: 'Purple', colors: ['#5718C0', '#AB77FF', '#D5BBFF'] },
  { id: 'blue', label: 'Blue', colors: ['#115EF3', '#3FB5FE', '#C5E9FF'] },
  { id: 'teal', label: 'Teal / Sage', colors: ['#99EDFF', '#96AFAC', '#E5ECE7'] },
  { id: 'green', label: 'Green / Lime', colors: ['#004012', '#ADFF00', '#F1FFD2', '#C8FF66'] },
  { id: 'earth', label: 'Earth / Yellow', colors: ['#403700', '#FFFF00', '#D9D7CC'] },
  { id: 'red', label: 'Red / Pink', colors: ['#EC0648', '#F57EC3', '#FFC4D8'] },
  { id: 'neutral', label: 'Neutral', colors: ['#000000', '#FFFFFF'] },
];

const TONAL_GROUP_ORDER = [
  { id: 'blue', label: 'Blue / Cyan' },
  { id: 'purple', label: 'Purple' },
  { id: 'green', label: 'Green / Teal' },
  { id: 'lime', label: 'Lime / Yellow' },
  { id: 'pink', label: 'Pink / Red' },
  { id: 'neutral', label: 'Neutral / Earth' },
];

const PRESET_GROUP = {
  '2-a': 'blue', '2-b': 'pink', '2-c': 'green', '2-d': 'blue', '2-e': 'lime', '2-f': 'green',
  '2-g': 'lime', '2-h': 'green', '2-i': 'green', '2-j': 'lime', '2-k': 'lime', '2-l': 'neutral',
  '2-m': 'blue', '2-n': 'pink', '2-o': 'neutral', '2-p': 'blue', '2-q': 'pink', '2-r': 'neutral',
  '2-s': 'neutral', '2-t': 'pink', '2-u': 'neutral', '2-v': 'green', '2-w': 'blue', '2-x': 'lime',
  '2-y': 'green', '2-z': 'pink',
  '2-aa': 'purple', '2-ab': 'purple', '2-ac': 'purple', '2-ad': 'purple', '2-ae': 'purple', '2-af': 'purple',
  '3-a': 'neutral', '3-b': 'pink', '3-c': 'blue', '3-d': 'blue', '3-e': 'blue', '3-f': 'neutral',
  '3-g': 'blue', '3-h': 'neutral', '3-i': 'green', '3-j': 'pink', '3-k': 'lime', '3-l': 'neutral',
  '3-m': 'pink', '3-n': 'green', '3-o': 'neutral', '3-p': 'blue',
  '3-q': 'purple', '3-r': 'purple', '3-s': 'purple', '3-t': 'purple',
  '5-a': 'neutral', '5-b': 'pink', '5-c': 'blue', '5-d': 'neutral', '5-e': 'neutral', '5-f': 'blue',
  '5-g': 'neutral', '5-h': 'blue', '5-i': 'green', '5-j': 'pink', '5-k': 'lime', '5-l': 'pink',
  '5-m': 'neutral', '5-n': 'green', '5-o': 'pink', '5-p': 'neutral',
  '5-q': 'purple', '5-r': 'purple', '5-s': 'purple',
  '4-a': 'neutral', '4-b': 'pink', '4-c': 'blue', '4-d': 'neutral', '4-e': 'neutral', '4-f': 'blue',
  '4-g': 'neutral', '4-h': 'blue', '4-i': 'green', '4-j': 'pink', '4-k': 'lime', '4-l': 'pink',
  '4-m': 'neutral', '4-n': 'green', '4-o': 'pink', '4-p': 'neutral',
  '4-q': 'purple', '4-r': 'purple', '4-s': 'purple',
};


function attachPresetGroup(preset) {
  return { ...preset, group: preset.group || PRESET_GROUP[preset.id] || 'neutral' };
}

function getGroupedTonalPresets(count) {
  const presets = (TONAL_BY_COUNT[count] || []).map(attachPresetGroup);
  return TONAL_GROUP_ORDER.map(group => ({
    ...group,
    presets: presets.filter(p => p.group === group.id),
  })).filter(section => section.presets.length);
}

function normalizePaletteColorKey(hex) {
  let h = String(hex || '').trim().toUpperCase();
  if (!h) return '#000000';
  if (!h.startsWith('#')) h = '#' + h;
  if (h.length === 4) h = '#' + h.slice(1).split('').map(c => c + c).join('');
  return h;
}
