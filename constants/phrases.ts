export interface Phrase {
  key: string;
  text: string;
  category: 'medical' | 'rescue' | 'evacuation' | 'children';
  icon: string;
  urgency: number;
}

export const EMERGENCY_PHRASES: Phrase[] = [
  // Medical
  { key: 'need_medical', text: 'I need medical help', category: 'medical', icon: '🏥', urgency: 5 },
  { key: 'injured', text: 'I am injured', category: 'medical', icon: '🩹', urgency: 5 },
  { key: 'cant_breathe', text: 'I cannot breathe', category: 'medical', icon: '😮‍💨', urgency: 5 },
  { key: 'unconscious', text: 'Someone is unconscious', category: 'medical', icon: '🫀', urgency: 5 },

  // Rescue
  { key: 'trapped', text: 'I am trapped under rubble', category: 'rescue', icon: '🆘', urgency: 5 },
  { key: 'help_here', text: 'Help! I am here', category: 'rescue', icon: '📍', urgency: 5 },
  { key: 'need_rescue', text: 'We need rescue immediately', category: 'rescue', icon: '🚁', urgency: 5 },
  { key: 'fire', text: 'There is a fire', category: 'rescue', icon: '🔥', urgency: 5 },

  // Evacuation
  { key: 'evacuation_point', text: 'Where is the evacuation point?', category: 'evacuation', icon: '🏃', urgency: 4 },
  { key: 'need_water', text: 'I need water and food', category: 'evacuation', icon: '💧', urgency: 4 },
  { key: 'safe', text: 'I am safe', category: 'evacuation', icon: '✅', urgency: 2 },
  { key: 'how_many', text: 'How many survivors are here?', category: 'evacuation', icon: '👥', urgency: 3 },

  // Children / Elderly
  { key: 'children', text: 'I have children with me', category: 'children', icon: '👧', urgency: 4 },
  { key: 'elderly', text: 'I have an elderly person with me', category: 'children', icon: '👴', urgency: 4 },
  { key: 'disabled', text: 'I have a disabled person with me', category: 'children', icon: '♿', urgency: 4 },
  { key: 'separated', text: 'I am separated from my family', category: 'children', icon: '👨‍👩‍👧', urgency: 4 },
];

export const PHRASE_CATEGORIES = [
  { id: 'medical', label: 'Medical', icon: '🏥', color: '#E53E3E' },
  { id: 'rescue', label: 'Rescue', icon: '🆘', color: '#DD6B20' },
  { id: 'evacuation', label: 'Evacuation', icon: '🏃', color: '#2B6CB0' },
  { id: 'children', label: 'Vulnerable', icon: '👧', color: '#6B46C1' },
] as const;
