CREATE TYPE "AssignmentStatus" AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'processing', 'sent', 'failed', 'skipped');
CREATE TYPE "NotificationType" AS ENUM ('day_before', 'same_day');
CREATE TYPE "NotificationMode" AS ENUM ('day_before', 'same_day', 'both');

CREATE TABLE "admins" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "members" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "members_active_sort_order_idx" ON "members"("active", "sort_order");
CREATE TABLE "schedule_settings" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "monday" BOOLEAN NOT NULL DEFAULT true,
  "tuesday" BOOLEAN NOT NULL DEFAULT true,
  "wednesday" BOOLEAN NOT NULL DEFAULT true,
  "thursday" BOOLEAN NOT NULL DEFAULT true,
  "friday" BOOLEAN NOT NULL DEFAULT true,
  "saturday" BOOLEAN NOT NULL DEFAULT false,
  "sunday" BOOLEAN NOT NULL DEFAULT false,
  "email_enabled" BOOLEAN NOT NULL DEFAULT true,
  "notification_mode" "NotificationMode" NOT NULL DEFAULT 'day_before',
  "notification_time" TEXT NOT NULL DEFAULT '18:00',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  "pending_rule_change" BOOLEAN NOT NULL DEFAULT false,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "schedule_exceptions" (
  "id" TEXT PRIMARY KEY,
  "date" DATE NOT NULL UNIQUE,
  "type" TEXT NOT NULL DEFAULT 'skip',
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "rotation_state" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "cursor" INTEGER NOT NULL DEFAULT 0,
  "last_assignment_date" DATE,
  "last_assignment_id" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "assignments" (
  "id" TEXT PRIMARY KEY,
  "duty_date" DATE NOT NULL UNIQUE,
  "member_1_id" TEXT NOT NULL,
  "member_1_name" TEXT NOT NULL,
  "member_1_email" TEXT,
  "member_2_id" TEXT NOT NULL,
  "member_2_name" TEXT NOT NULL,
  "member_2_email" TEXT,
  "cursor_before" INTEGER NOT NULL,
  "status" "AssignmentStatus" NOT NULL DEFAULT 'scheduled',
  "notification_status" TEXT NOT NULL DEFAULT 'pending',
  "notification_sent_at" TIMESTAMP(3),
  "is_manual_override" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "assignments_status_duty_date_idx" ON "assignments"("status", "duty_date");
CREATE UNIQUE INDEX "assignments_one_scheduled_idx" ON "assignments" (("status")) WHERE "status" = 'scheduled';
CREATE TABLE "notification_logs" (
  "id" TEXT PRIMARY KEY,
  "assignment_id" TEXT NOT NULL REFERENCES "assignments"("id") ON DELETE CASCADE,
  "member_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "notification_type" "NotificationType" NOT NULL,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
  "provider_message_id" TEXT,
  "error_message" TEXT,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3),
  "locked_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_logs_assignment_id_member_id_notification_type_key" UNIQUE ("assignment_id", "member_id", "notification_type")
);
CREATE INDEX "notification_logs_status_scheduled_for_idx" ON "notification_logs"("status", "scheduled_for");
CREATE TABLE "worker_state" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "last_tick_at" TIMESTAMP(3),
  "last_scheduler_success_at" TIMESTAMP(3),
  "last_notification_run_at" TIMESTAMP(3),
  "last_assignment_generated_at" TIMESTAMP(3),
  "last_email_sent_at" TIMESTAMP(3),
  "last_error" TEXT,
  "worker_version" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL
);
