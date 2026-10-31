-- The buttons links.bengottschalk.com showed before links moved to the database.
INSERT INTO `links` (`id`, `label`, `url`, `description`, `icon`, `position`, `visible`, `created_at`, `updated_at`) VALUES
  ('website1', 'My website', 'https://www.bengottschalk.com', 'Cubing, videos, projects and more', 'globe', 0, 1, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
  ('results1', 'Competition results', 'https://www.bengottschalk.com/cubing/results', 'PRs, podiums and records', 'medal', 1, 1, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
  ('wcaprof1', 'WCA profile', 'https://www.worldcubeassociation.org/persons/2016GOTT01', NULL, 'trophy', 2, 1, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer)),
  ('contact1', 'Get in touch', 'https://www.bengottschalk.com/contact', NULL, 'mail', 3, 1, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
