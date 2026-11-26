BEGIN;
-- Keep existing data. Duplicate days/positions must be reconciled by their owner,
-- never silently deleted to satisfy the new unique constraints.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Workout" WHERE date IS NOT NULL GROUP BY "userId",date HAVING COUNT(*)>1)
     OR EXISTS (SELECT 1 FROM "WorkoutExercise" GROUP BY "workoutId",position HAVING COUNT(*)>1) THEN
    RAISE EXCEPTION 'Duplicate workout days or positions: reconcile and back up existing data before migrating';
  END IF;
END $$;
-- AlterEnum
ALTER TYPE "WorkoutStatus" ADD VALUE 'RUHE';

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "catalogId" TEXT;

-- AlterTable
ALTER TABLE "TrainingPlan" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'Mittel',
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN     "goal" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "muscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Full Body';

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "intensity" TEXT NOT NULL DEFAULT 'Mittel',
ADD COLUMN     "muscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sourceTemplateId" TEXT,
ADD COLUMN     "time" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Full Body';

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "catalogId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "repetitions" TEXT,
ADD COLUMN     "restSeconds" INTEGER;

-- CreateTable
CREATE TABLE "PlanExercise" (
    "id" TEXT NOT NULL,
    "trainingPlanId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "repetitions" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "restSeconds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "PlanExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDateIso" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "targetWeightKg" DOUBLE PRECISION NOT NULL,
    "targetDateIso" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "weeklyWorkoutGoal" INTEGER NOT NULL,
    "preferredTrainingDays" TEXT[],
    "energyFormula" TEXT,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RevokedToken" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanExercise_trainingPlanId_position_key" ON "PlanExercise"("trainingPlanId", "position");

-- CreateIndex
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_catalogId_key" ON "Exercise"("catalogId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPlan_userId_clientId_key" ON "TrainingPlan"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_userId_date_key" ON "Workout"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercise_workoutId_position_key" ON "WorkoutExercise"("workoutId", "position");

-- AddForeignKey
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevokedToken" ADD CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "WorkoutExercise" SET repetitions = reps::text WHERE reps IS NOT NULL;
COMMIT;
