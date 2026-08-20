-- Scolaris — données de démo
-- Reprend les données d'exemple des prototypes Claude Design
-- (STUDENTS / SCHOOLS dans les fichiers .dc.html) pour peupler un projet
-- Supabase fraîchement créé et pouvoir tester l'app enseignant et le
-- dashboard fédération avec des données réalistes.

-- ─────────────────────────────────────────────────────────────────────────
-- Référentiel des 114 sourates
-- ─────────────────────────────────────────────────────────────────────────

insert into public.sourates (id, num, name, name_ar) values
  (1, 1, 'Al-Fatiha', 'الفاتحة'),
  (2, 2, 'Al-Baqara', 'البقرة'),
  (3, 3, 'Aali Imran', 'آل عمران'),
  (4, 4, 'An-Nisa', 'النساء'),
  (5, 5, 'Al-Ma''ida', 'المائدة'),
  (6, 6, 'Al-An''am', 'الأنعام'),
  (7, 7, 'Al-A''raf', 'الأعراف'),
  (8, 8, 'Al-Anfal', 'الأنفال'),
  (9, 9, 'At-Tawba', 'التوبة'),
  (10, 10, 'Yunus', 'يونس'),
  (11, 11, 'Hud', 'هود'),
  (12, 12, 'Yusuf', 'يوسف'),
  (13, 13, 'Ar-Ra''d', 'الرعد'),
  (14, 14, 'Ibrahim', 'إبراهيم'),
  (15, 15, 'Al-Hijr', 'الحجر'),
  (16, 16, 'An-Nahl', 'النحل'),
  (17, 17, 'Al-Isra', 'الإسراء'),
  (18, 18, 'Al-Kahf', 'الكهف'),
  (19, 19, 'Maryam', 'مريم'),
  (20, 20, 'Ta-Ha', 'طه'),
  (21, 21, 'Al-Anbiya', 'الأنبياء'),
  (22, 22, 'Al-Hajj', 'الحج'),
  (23, 23, 'Al-Mu''minun', 'المؤمنون'),
  (24, 24, 'An-Nur', 'النور'),
  (25, 25, 'Al-Furqan', 'الفرقان'),
  (26, 26, 'Ash-Shu''ara', 'الشعراء'),
  (27, 27, 'An-Naml', 'النمل'),
  (28, 28, 'Al-Qasas', 'القصص'),
  (29, 29, 'Al-Ankabut', 'العنكبوت'),
  (30, 30, 'Ar-Rum', 'الروم'),
  (31, 31, 'Luqman', 'لقمان'),
  (32, 32, 'As-Sajda', 'السجدة'),
  (33, 33, 'Al-Ahzab', 'الأحزاب'),
  (34, 34, 'Saba', 'سبأ'),
  (35, 35, 'Fatir', 'فاطر'),
  (36, 36, 'Ya-Sin', 'يس'),
  (37, 37, 'As-Saffat', 'الصافات'),
  (38, 38, 'Sad', 'ص'),
  (39, 39, 'Az-Zumar', 'الزمر'),
  (40, 40, 'Ghafir', 'غافر'),
  (41, 41, 'Fussilat', 'فصلت'),
  (42, 42, 'Ash-Shura', 'الشورى'),
  (43, 43, 'Az-Zukhruf', 'الزخرف'),
  (44, 44, 'Ad-Dukhan', 'الدخان'),
  (45, 45, 'Al-Jathiya', 'الجاثية'),
  (46, 46, 'Al-Ahqaf', 'الأحقاف'),
  (47, 47, 'Muhammad', 'محمد'),
  (48, 48, 'Al-Fath', 'الفتح'),
  (49, 49, 'Al-Hujurat', 'الحجرات'),
  (50, 50, 'Qaf', 'ق'),
  (51, 51, 'Adh-Dhariyat', 'الذاريات'),
  (52, 52, 'At-Tur', 'الطور'),
  (53, 53, 'An-Najm', 'النجم'),
  (54, 54, 'Al-Qamar', 'القمر'),
  (55, 55, 'Ar-Rahman', 'الرحمن'),
  (56, 56, 'Al-Waqi''a', 'الواقعة'),
  (57, 57, 'Al-Hadid', 'الحديد'),
  (58, 58, 'Al-Mujadila', 'المجادلة'),
  (59, 59, 'Al-Hashr', 'الحشر'),
  (60, 60, 'Al-Mumtahina', 'الممتحنة'),
  (61, 61, 'As-Saff', 'الصف'),
  (62, 62, 'Al-Jumu''a', 'الجمعة'),
  (63, 63, 'Al-Munafiqun', 'المنافقون'),
  (64, 64, 'At-Taghabun', 'التغابن'),
  (65, 65, 'At-Talaq', 'الطلاق'),
  (66, 66, 'At-Tahrim', 'التحريم'),
  (67, 67, 'Al-Mulk', 'الملك'),
  (68, 68, 'Al-Qalam', 'القلم'),
  (69, 69, 'Al-Haqqa', 'الحاقة'),
  (70, 70, 'Al-Ma''arij', 'المعارج'),
  (71, 71, 'Nuh', 'نوح'),
  (72, 72, 'Al-Jinn', 'الجن'),
  (73, 73, 'Al-Muzzammil', 'المزمل'),
  (74, 74, 'Al-Muddaththir', 'المدثر'),
  (75, 75, 'Al-Qiyama', 'القيامة'),
  (76, 76, 'Al-Insan', 'الإنسان'),
  (77, 77, 'Al-Mursalat', 'المرسلات'),
  (78, 78, 'An-Naba', 'النبأ'),
  (79, 79, 'An-Nazi''at', 'النازعات'),
  (80, 80, 'Abasa', 'عبس'),
  (81, 81, 'At-Takwir', 'التكوير'),
  (82, 82, 'Al-Infitar', 'الانفطار'),
  (83, 83, 'Al-Mutaffifin', 'المطففين'),
  (84, 84, 'Al-Inshiqaq', 'الانشقاق'),
  (85, 85, 'Al-Buruj', 'البروج'),
  (86, 86, 'At-Tariq', 'الطارق'),
  (87, 87, 'Al-A''la', 'الأعلى'),
  (88, 88, 'Al-Ghashiya', 'الغاشية'),
  (89, 89, 'Al-Fajr', 'الفجر'),
  (90, 90, 'Al-Balad', 'البلد'),
  (91, 91, 'Ash-Shams', 'الشمس'),
  (92, 92, 'Al-Layl', 'الليل'),
  (93, 93, 'Ad-Duha', 'الضحى'),
  (94, 94, 'Ash-Sharh', 'الشرح'),
  (95, 95, 'At-Tin', 'التين'),
  (96, 96, 'Al-''Alaq', 'العلق'),
  (97, 97, 'Al-Qadr', 'القدر'),
  (98, 98, 'Al-Bayyina', 'البينة'),
  (99, 99, 'Az-Zalzala', 'الزلزلة'),
  (100, 100, 'Al-''Adiyat', 'العاديات'),
  (101, 101, 'Al-Qari''a', 'القارعة'),
  (102, 102, 'At-Takathur', 'التكاثر'),
  (103, 103, 'Al-''Asr', 'العصر'),
  (104, 104, 'Al-Humaza', 'الهمزة'),
  (105, 105, 'Al-Fil', 'الفيل'),
  (106, 106, 'Quraysh', 'قريش'),
  (107, 107, 'Al-Ma''un', 'الماعون'),
  (108, 108, 'Al-Kawthar', 'الكوثر'),
  (109, 109, 'Al-Kafirun', 'الكافرون'),
  (110, 110, 'An-Nasr', 'النصر'),
  (111, 111, 'Al-Masad', 'المسد'),
  (112, 112, 'Al-Ikhlas', 'الإخلاص'),
  (113, 113, 'Al-Falaq', 'الفلق'),
  (114, 114, 'An-Nas', 'الناس');

-- ─────────────────────────────────────────────────────────────────────────
-- Fédération + écoles membres (repris du dashboard fédération)
-- ─────────────────────────────────────────────────────────────────────────

insert into public.federations (id, name, name_ar, region) values
  ('00000000-0000-0000-0000-000000000001', 'OEECI · Scolaris', null, 'Côte d''Ivoire');

insert into public.schools (id, federation_id, name, name_ar, region, status, contact_name, contact_phone) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Médersa An-Nour', 'مدرسة النور', 'Abidjan · Abobo', 'non_integree', 'Cheikh Ibrahim Koné', '07 00 00 01'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'École coranique Al-Hidaya', 'الهداية', 'Abidjan · Koumassi', 'non_integree', 'El Hadj Moussa Bamba', '07 00 00 02'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Médersa Al-Falah', 'الفلاح', 'Bouaké', 'integree', 'Cheikh Adama Touré', '07 00 00 03'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'École franco-arabe Al-Amine', 'الأمين', 'Korhogo', 'en_cours', 'Ousmane Diarrassouba', '07 00 00 04'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'Médersa Ar-Rahma', 'الرحمة', 'Odienné', 'non_integree', 'Cheikh Yaya Diallo', '07 00 00 05'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', 'École coranique Badr', 'بدر', 'Ferkessédougou', 'non_integree', 'Aboubakar Sangaré', '07 00 00 06'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', 'Médersa Al-Ihsan', 'الإحسان', 'Abidjan · Yopougon', 'en_cours', 'Cheikh Karim Cissé', '07 00 00 07'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', 'École coranique As-Sabil', 'السبيل', 'Man', 'non_integree', 'Salif Coulibaly', '07 00 00 08'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001', 'Médersa Al-Furqan', 'الفرقان', 'Bouaké', 'non_integree', 'Cheikh Ismaël Fofana', '07 00 00 09'),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', 'École franco-arabe Taqwa', 'التقوى', 'Korhogo', 'integree', 'Mamadou Ouattara', '07 00 00 10');

-- ─────────────────────────────────────────────────────────────────────────
-- Élèves de la Médersa An-Nour (école de démo pour l'app enseignant)
-- ─────────────────────────────────────────────────────────────────────────

insert into public.students (id, school_id, full_name, name_ar, age, classe, parent_name, parent_phone) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Ibrahim Koné', 'إبراهيم', 9, 'Coran 2', 'Adama Koné', '07 48 12 90'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Aïcha Traoré', 'عائشة', 8, 'Coran 1', 'Salif Traoré', '05 61 30 22'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'Moussa Bamba', 'موسى', 11, 'Coran 3', 'Yaya Bamba', '01 02 77 45'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000101', 'Fatoumata Diallo', 'فاطمة', 7, 'Coran 1', 'Binta Diallo', '07 19 55 08'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'Aboubakar Ouattara', 'أبو بكر', 10, 'Coran 2', 'Issa Ouattara', '05 44 61 73'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000101', 'Mariam Cissé', 'مريم', 9, 'Coran 2', 'Oumou Cissé', '01 88 24 16'),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000101', 'Yacouba Coulibaly', 'يعقوب', 12, 'Coran 3', 'Sekou Coulibaly', '07 33 09 51'),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000101', 'Hadja Touré', 'خديجة', 8, 'Coran 1', 'Fanta Touré', '05 27 84 60'),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000101', 'Ismaël Sangaré', 'إسماعيل', 10, 'Coran 2', 'Karim Sangaré', '01 45 92 38'),
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000101', 'Kadiatou Fofana', 'خديجة', 7, 'Coran 1', 'Aminata Fofana', '07 76 41 29');

-- Mémorisation : les `memo` premières sourates (à partir du juz' 30, num 114 → 1)
-- sont marquées "ok" pour chaque élève, comme dans le prototype.
with memo_counts (student_id, memo) as (
  values
    ('00000000-0000-0000-0000-000000000201'::uuid, 14),
    ('00000000-0000-0000-0000-000000000202'::uuid, 9),
    ('00000000-0000-0000-0000-000000000203'::uuid, 18),
    ('00000000-0000-0000-0000-000000000204'::uuid, 5),
    ('00000000-0000-0000-0000-000000000205'::uuid, 12),
    ('00000000-0000-0000-0000-000000000206'::uuid, 11),
    ('00000000-0000-0000-0000-000000000207'::uuid, 20),
    ('00000000-0000-0000-0000-000000000208'::uuid, 7),
    ('00000000-0000-0000-0000-000000000209'::uuid, 13),
    ('00000000-0000-0000-0000-000000000210'::uuid, 4)
),
ordered_sourates as (
  select id, row_number() over (order by num desc) as rank
  from public.sourates
)
insert into public.memorization_progress (student_id, sourate_id, status, validated_at)
select
  mc.student_id,
  os.id,
  case when os.rank < mc.memo then 'ok' when os.rank = mc.memo then 'wip' else 'todo' end,
  case when os.rank <= mc.memo then now() else null end
from memo_counts mc
join ordered_sourates os on os.rank <= mc.memo + 1;

-- Présence du jour
insert into public.attendance (student_id, date, present) values
  ('00000000-0000-0000-0000-000000000201', current_date, true),
  ('00000000-0000-0000-0000-000000000202', current_date, true),
  ('00000000-0000-0000-0000-000000000203', current_date, true),
  ('00000000-0000-0000-0000-000000000204', current_date, false),
  ('00000000-0000-0000-0000-000000000205', current_date, true),
  ('00000000-0000-0000-0000-000000000206', current_date, true),
  ('00000000-0000-0000-0000-000000000207', current_date, false),
  ('00000000-0000-0000-0000-000000000208', current_date, true),
  ('00000000-0000-0000-0000-000000000209', current_date, true);
  -- Kadiatou Fofana : pas de statut renseigné aujourd'hui (comme le prototype)

-- Mensualités d'août 2026 (3 000 FCFA)
insert into public.payments (student_id, period, amount, status, method, receipt_no, paid_at) values
  ('00000000-0000-0000-0000-000000000201', '2026-08', 3000, 'paid', 'Wave', 'Reçu N° 0139 / 2026', now()),
  ('00000000-0000-0000-0000-000000000202', '2026-08', 3000, 'paid', 'Orange Money', 'Reçu N° 0140 / 2026', now()),
  ('00000000-0000-0000-0000-000000000203', '2026-08', 3000, 'unpaid', null, null, null),
  ('00000000-0000-0000-0000-000000000204', '2026-08', 3000, 'unpaid', null, null, null),
  ('00000000-0000-0000-0000-000000000205', '2026-08', 3000, 'paid', 'MTN Money', 'Reçu N° 0141 / 2026', now()),
  ('00000000-0000-0000-0000-000000000206', '2026-08', 3000, 'paid', 'Wave', 'Reçu N° 0142 / 2026', now()),
  ('00000000-0000-0000-0000-000000000207', '2026-08', 3000, 'paid', 'Orange Money', 'Reçu N° 0143 / 2026', now()),
  ('00000000-0000-0000-0000-000000000208', '2026-08', 3000, 'unpaid', null, null, null),
  ('00000000-0000-0000-0000-000000000209', '2026-08', 3000, 'paid', 'Wave', 'Reçu N° 0144 / 2026', now()),
  ('00000000-0000-0000-0000-000000000210', '2026-08', 3000, 'unpaid', null, null, null);
