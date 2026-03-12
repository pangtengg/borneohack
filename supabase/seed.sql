insert into glossary_entries (dialect_id, slang, formal, target_lang, notes) values
  ('kelantan_malay', 'ambo',  'saya',   'ms', 'First person pronoun (I/me)'),
  ('kelantan_malay', 'demo',  'awak',   'ms', 'Second person pronoun (you)'),
  ('kelantan_malay', 'doh',   'sudah',  'ms', 'Sentence-final particle (already/done)'),
  ('kelantan_malay', 'tok',   'tidak',  'ms', 'Negation (no/not)'),
  ('kelantan_malay', 'gapo',  'apa',    'ms', 'Question word (what)'),
  ('kelantan_malay', 'mano',  'mana',   'ms', 'Where'),
  ('kelantan_malay', 'sapo',  'siapa',  'ms', 'Who'),
  ('kelantan_malay', 'gi',    'pergi',  'ms', 'Go'),
  ('kelantan_malay', 'nok',   'nak',    'ms', 'Want'),
  ('kelantan_malay', 'rumoh', 'rumah',  'ms', 'House');

insert into glossary_entries (dialect_id, slang, formal, target_lang, notes) values
  ('penang_hokkien', 'wa',      'saya',         'ms', 'I / me'),
  ('penang_hokkien', 'lu',      'awak',         'ms', 'You'),
  ('penang_hokkien', 'liao',    'sudah',        'ms', 'Already / done'),
  ('penang_hokkien', 'beh',     'tidak boleh',  'ms', 'Cannot'),
  ('penang_hokkien', 'tahan',   'bertahan',     'ms', 'Endure / hold on'),
  ('penang_hokkien', 'eh',      'boleh',        'ms', 'Can (informal)'),
  ('penang_hokkien', 'sai',     'boleh',        'ms', 'Can / able to'),
  ('penang_hokkien', 'gin-na',  'kanak-kanak',  'ms', 'Child / children'),
  ('penang_hokkien', 'shiok',   'bagus',        'ms', 'Great / wonderful'),
  ('penang_hokkien', 'makan',   'makanan',      'ms', 'Food / eat');

insert into ghost_phrases
  (language_name, language_code, phrase_text, meaning_en, meaning_ms, context_tag, storage_path, recorded_by)
values
  ('Temiar', 'tmr', 'cem naa',        'I need help',              'Saya perlu bantuan',      'emergency', 'temiar/cem_naa.wav',        'Temiar Community, Gua Musang'),
  ('Temiar', 'tmr', 'saloh nii',      'I am in pain',             'Saya sakit',              'medical',   'temiar/saloh_nii.wav',      'Temiar Community, Gua Musang'),
  ('Temiar', 'tmr', 'waak manooh',    'Where is water',           'Di mana air',             'medical',   'temiar/waak_manooh.wav',    'Temiar Community'),
  ('Temiar', 'tmr', 'loo kamiik',     'We are lost',              'Kami sesat',              'location',  'temiar/loo_kamiik.wav',     'Temiar Community'),
  ('Semai',  'sea', 'tolong amii',    'Help us',                  'Tolong kami',             'emergency', 'semai/tolong_amii.wav',     'Semai Community, Pos Dipang'),
  ('Semai',  'sea', 'gob ngaan',      'Child is hurt',            'Kanak-kanak cedera',      'medical',   'semai/gob_ngaan.wav',       'Semai Community'),
  ('Semai',  'sea', 'minum penaap',   'Need drinking water',      'Perlu air minum',         'medical',   'semai/minum_penaap.wav',    'Semai Community'),
  ('Jakun',  'jak', 'aku perlu',      'I need help',              'Saya perlu bantuan',      'emergency', 'jakun/aku_perlu.wav',       'Jakun Community, Tasik Chini'),
  ('Jakun',  'jak', 'sakit badan',    'My body hurts',            'Badan saya sakit',        'medical',   'jakun/sakit_badan.wav',     'Jakun Community'),
  ('Jakun',  'jak', 'mano hospital',  'Where is the hospital',    'Di mana hospital',        'location',  'jakun/mano_hospital.wav',   'Jakun Community');
