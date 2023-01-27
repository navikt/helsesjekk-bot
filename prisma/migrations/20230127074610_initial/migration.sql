-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "postDay" INTEGER NOT NULL,
    "postHour" INTEGER NOT NULL,
    "revealDay" INTEGER NOT NULL,
    "revealHour" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asked" (
    "id" SERIAL NOT NULL,
    "messageTs" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "questions" JSONB NOT NULL,
    "revealed" BOOLEAN NOT NULL,

    CONSTRAINT "Asked_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "answeredAt" TIMESTAMP(3) NOT NULL,
    "askedId" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("userId","askedId")
);

-- AddForeignKey
ALTER TABLE "Asked" ADD CONSTRAINT "Asked_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_askedId_fkey" FOREIGN KEY ("askedId") REFERENCES "Asked"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
