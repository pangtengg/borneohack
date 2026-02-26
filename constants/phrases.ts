export interface Phrase {
  key: string;
  text: string;
  category: 'medical' | 'rescue' | 'evacuation' | 'children';
  icon: string;
}

export const EMERGENCY_PHRASES: Phrase[] = [
  // Medical
  { key: 'need_medical', text: 'I need medical help', category: 'medical', icon: '🏥' },
  { key: 'injured', text: 'I am injured', category: 'medical', icon: '🩹' },
  { key: 'cant_breathe', text: 'I cannot breathe', category: 'medical', icon: '😮‍💨' },
  { key: 'unconscious', text: 'Someone is unconscious', category: 'medical', icon: '🫀' },

  // Rescue
  { key: 'trapped', text: 'I am trapped under rubble', category: 'rescue', icon: '🆘' },
  { key: 'help_here', text: 'Help! I am here', category: 'rescue', icon: '📍' },
  { key: 'need_rescue', text: 'We need rescue immediately', category: 'rescue', icon: '🚁' },
  { key: 'fire', text: 'There is a fire', category: 'rescue', icon: '🔥' },

  // Evacuation
  { key: 'evacuation_point', text: 'Where is the evacuation point?', category: 'evacuation', icon: '🏃' },
  { key: 'need_water', text: 'I need water and food', category: 'evacuation', icon: '💧' },
  { key: 'safe', text: 'I am safe', category: 'evacuation', icon: '✅' },
  { key: 'how_many', text: 'How many survivors are here?', category: 'evacuation', icon: '👥' },

  // Children / Elderly
  { key: 'children', text: 'I have children with me', category: 'children', icon: '👧' },
  { key: 'elderly', text: 'I have an elderly person with me', category: 'children', icon: '👴' },
  { key: 'disabled', text: 'I have a disabled person with me', category: 'children', icon: '♿' },
  { key: 'separated', text: 'I am separated from my family', category: 'children', icon: '👨‍👩‍👧' },
];

export const PHRASE_CATEGORIES = [
  { id: 'medical', label: 'Medical', icon: '🏥', color: '#E53E3E' },
  { id: 'rescue', label: 'Rescue', icon: '🆘', color: '#DD6B20' },
  { id: 'evacuation', label: 'Evacuation', icon: '🏃', color: '#2B6CB0' },
  { id: 'children', label: 'Vulnerable', icon: '👧', color: '#6B46C1' },
] as const;
