BEGIN TRANSACTION;

INSERT INTO match_history (opponent, result, score, map_name, played_at)
SELECT opponent, result, score, map_name, played_at
FROM (
SELECT 'Cyber Wolves' AS opponent, 'win' AS result, '13:5' AS score, 'Ascent' AS map_name, '2026-10-05 18:00:00' AS played_at
  UNION ALL
SELECT 'Pixel Smashers' AS opponent, 'win' AS result, '13:8' AS score, 'Bind' AS map_name, '2026-10-06 19:30:00' AS played_at
  UNION ALL
SELECT 'Savage Squad' AS opponent, 'win' AS result, '13:11' AS score, 'Haven' AS map_name, '2026-10-07 20:00:00' AS played_at
  UNION ALL
SELECT 'Phantom Gaming' AS opponent, 'win' AS result, '14:12' AS score, 'Split' AS map_name, '2026-10-08 18:15:00' AS played_at
  UNION ALL
SELECT 'Neon Strike' AS opponent, 'win' AS result, '13:7' AS score, 'Lotus' AS map_name, '2026-10-09 19:00:00' AS played_at
  UNION ALL
SELECT 'Reloaded eSports' AS opponent, 'win' AS result, '13:4' AS score, 'Sunset' AS map_name, '2026-10-10 20:30:00' AS played_at
  UNION ALL
SELECT 'Cyber Wolves' AS opponent, 'win' AS result, '13:9' AS score, 'Icebox' AS map_name, '2026-10-11 18:45:00' AS played_at
  UNION ALL
SELECT 'Pixel Smashers' AS opponent, 'win' AS result, '13:6' AS score, 'Pearl' AS map_name, '2026-10-12 19:15:00' AS played_at
  UNION ALL
SELECT 'Savage Squad' AS opponent, 'win' AS result, '13:10' AS score, 'Abyss' AS map_name, '2026-10-13 20:00:00' AS played_at
  UNION ALL
SELECT 'Phantom Gaming' AS opponent, 'win' AS result, '13:2' AS score, 'Ascent' AS map_name, '2026-10-14 18:30:00' AS played_at
  UNION ALL
SELECT 'Neon Strike' AS opponent, 'win' AS result, '13:11' AS score, 'Bind' AS map_name, '2026-10-15 19:45:00' AS played_at
  UNION ALL
SELECT 'Reloaded eSports' AS opponent, 'win' AS result, '14:12' AS score, 'Haven' AS map_name, '2026-10-16 20:15:00' AS played_at
  UNION ALL
SELECT 'Cyber Wolves' AS opponent, 'win' AS result, '13:8' AS score, 'Split' AS map_name, '2026-10-17 18:00:00' AS played_at
  UNION ALL
SELECT 'Pixel Smashers' AS opponent, 'win' AS result, '13:5' AS score, 'Lotus' AS map_name, '2026-10-18 19:30:00' AS played_at
  UNION ALL
SELECT 'Savage Squad' AS opponent, 'win' AS result, '13:7' AS score, 'Sunset' AS map_name, '2026-10-19 20:00:00' AS played_at
  UNION ALL
SELECT 'Phantom Gaming' AS opponent, 'loss' AS result, '9:13' AS score, 'Icebox' AS map_name, '2026-10-20 18:45:00' AS played_at
  UNION ALL
SELECT 'Neon Strike' AS opponent, 'win' AS result, '13:6' AS score, 'Pearl' AS map_name, '2026-10-21 19:15:00' AS played_at
  UNION ALL
SELECT 'Reloaded eSports' AS opponent, 'win' AS result, '13:10' AS score, 'Abyss' AS map_name, '2026-10-22 20:00:00' AS played_at
  UNION ALL
SELECT 'Cyber Wolves' AS opponent, 'loss' AS result, '11:13' AS score, 'Ascent' AS map_name, '2026-10-23 18:30:00' AS played_at
  UNION ALL
SELECT 'Pixel Smashers' AS opponent, 'win' AS result, '13:4' AS score, 'Bind' AS map_name, '2026-10-24 19:00:00' AS played_at
) AS v
WHERE NOT EXISTS (SELECT 1 FROM match_history);

COMMIT;
