ALTER TABLE "schedule_settings"
  ADD COLUMN "day_before_subject_template" TEXT NOT NULL DEFAULT '明天轮到你值日',
  ADD COLUMN "day_before_body_template" TEXT NOT NULL DEFAULT E'你好，{{recipient_name}}：\n\n明天（{{duty_date}}）轮到你和 {{partner_name}} 负责值日。\n\n本次值日成员：\n{{member_1_name}}\n{{member_2_name}}\n\n请记得按时完成值日。',
  ADD COLUMN "same_day_subject_template" TEXT NOT NULL DEFAULT '今天轮到你值日',
  ADD COLUMN "same_day_body_template" TEXT NOT NULL DEFAULT E'你好，{{recipient_name}}：\n\n今天（{{duty_date}}）轮到你和 {{partner_name}} 负责值日。\n\n本次值日成员：\n{{member_1_name}}\n{{member_2_name}}\n\n请记得按时完成值日。';
