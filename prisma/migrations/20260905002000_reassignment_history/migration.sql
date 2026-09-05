ALTER TABLE "assignments" DROP CONSTRAINT "assignments_duty_date_key";
CREATE UNIQUE INDEX "assignments_active_duty_date_idx"
  ON "assignments" ("duty_date")
  WHERE "status" <> 'cancelled';
