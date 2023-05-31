-- Migration that marks every previous Asked with 2 or less responses as skipped
UPDATE "Asked"
SET skipped = true
WHERE id IN (SELECT id
             FROM (SELECT A.id as id, count(A.id) as answerCount
                   FROM "Asked" A
                            LEFT JOIN "Answer" ON A.id = "Answer"."askedId"
                   GROUP BY A.id) as iaC
             WHERE answerCount <= 2);
