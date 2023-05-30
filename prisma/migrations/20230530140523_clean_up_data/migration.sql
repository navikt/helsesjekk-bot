-- Delete team that bugged out and posted a million health checks
DELETE FROM "Asked" WHERE "teamId" = 'C059Y900V6H';
DELETE FROM "Team" WHERE id = 'C059Y900V6H';

-- Delete teams that were never used
DELETE FROM "Asked" WHERE "teamId" = 'C04MJLUG3QW';
DELETE FROM "Team" WHERE id = 'C04MJLUG3QW';
DELETE FROM "Asked" WHERE "teamId" = 'C0253PFTEFP';
DELETE FROM "Team" WHERE id = 'C0253PFTEFP';
DELETE FROM "Asked" WHERE "teamId" = 'C054UU58FS4';
DELETE FROM "Team" WHERE id = 'C054UU58FS4';
