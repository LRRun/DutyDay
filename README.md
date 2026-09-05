# Duty Day

Duty Day 是一个完全自托管的内部值日排班系统。它按成员环形队列每次选择两人，自动跳过关闭的星期和指定日期；独立 Worker 即使无人访问网页也会持续维护下一次正式排班并发送邮件。

## 架构

- `web`：Next.js App Router 管理界面与健康检查 API
- `worker`：每分钟执行排班维护、通知入队/发送/重试和心跳更新
- `postgres`：PostgreSQL 16，数据存放在 Docker Volume `postgres_data`
- `migrate`：每次启动前幂等执行 Prisma migration 与初始 seed

Web 与 Worker 使用同一份镜像、代码和数据库。未来日历条目实时模拟，数据库只保存历史和一个下一次正式排班。

## 运行要求

- Linux 服务器（也可在 macOS/Windows Docker Desktop 运行）
- Docker Engine 24+ 与 Docker Compose v2
- 可访问的 SMTP 服务（仅在需要邮件通知时）

## 首次启动

```bash
cp .env.example .env
# 编辑 .env，至少修改 POSTGRES_PASSWORD、DATABASE_URL、SESSION_SECRET、ADMIN_EMAIL、ADMIN_PASSWORD
docker compose up -d --build
docker compose ps
```

访问 `http://SERVER_IP:3000`，用 `.env` 中的管理员邮箱和密码登录。首次启动只创建管理员和必要的系统设置，不会向生产环境写入示例成员。后续重启不会覆盖已有管理员密码。

`DATABASE_URL` 中的数据库密码必须与 `POSTGRES_PASSWORD` 一致。`SESSION_SECRET` 建议使用至少 32 字节的随机值，例如 `openssl rand -base64 48` 的输出。使用 HTTPS 反向代理时，将 `APP_URL` 改为公网 HTTPS 地址并设置 `SESSION_COOKIE_SECURE=true`；直接通过内部 HTTP 访问时保持 `false`。

## 日常操作

```bash
docker compose up -d
docker compose stop
docker compose logs -f web worker
docker compose ps
```

`docker compose down` 只删除容器和网络，**不会删除数据库数据**。只有 `docker compose down -v` 才会删除 PostgreSQL Volume；不要在生产环境随意使用 `-v`。

## 数据库 migration 与 seed

正常 `docker compose up -d` 会先自动运行 migration 和幂等 bootstrap。也可以手动执行：

```bash
docker compose run --rm migrate npx prisma migrate deploy
docker compose run --rm migrate npm run db:bootstrap
```

本地开发需要 Node.js 20+ 与 PostgreSQL：

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
npm run worker
```

`npm run db:seed` 仅用于开发环境，会加入 7 名示例成员和两个示例跳过日期；生产启动不会执行它。

## SMTP 配置

在 `.env` 中设置 `EMAIL_PROVIDER=smtp`、`SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASSWORD` 和 `SMTP_FROM`。密码只从环境变量读取，不会显示在界面或日志中。常见的 587 端口使用 `SMTP_SECURE=false`（STARTTLS），465 端口通常使用 `true`。修改后运行 `docker compose up -d --force-recreate web worker`。

邮件主题和正文在“设置 → 通知 → 邮件内容”中维护，可分别设置前一天提醒和当天提醒。支持收件人、搭档、值日日期及两名值日成员变量；界面提供点击插入和即时预览。模板保存时会拒绝未知变量、非受控 Mustache 语法和带换行的主题，Worker 始终读取已保存模板发送。

发送失败不会影响排班。Worker 会按约 5、15、30 分钟的节奏最多尝试 3 次；通知表上的唯一约束确保同一排班、成员和提醒类型只有一条发送记录。

## 排班机制

启用成员按 `sort_order` 构成环形队列，当前游标连续取两人并推进 2。奇数成员会自然跨圈配对。关闭的星期和指定跳过日期只参与“寻找下一有效日期”，不会推进游标。创建排班和推进游标位于同一 PostgreSQL Serializable transaction，并使用 advisory transaction lock；`assignments.duty_date` 还有唯一约束，因此多个 Worker 同时运行也不会生成重复排班。

Worker 每分钟依次：维护下一次正式排班、生成/发送到期通知、重试失败通知、更新心跳。每项任务独立处理错误。收到 SIGTERM/SIGINT 后会停止新 tick、等待当前任务完成、断开数据库再退出。

## 时区

日历值日日期使用 PostgreSQL `DATE`，系统时间戳使用 UTC。提醒时间按设置页面中的 IANA 时区（默认 `Asia/Shanghai`）转换为 UTC，支持欧洲和美洲夏令时。容器宿主机时区不会改变业务日期计算。

## 测试

```bash
npm test
```

集成测试必须指向专用测试数据库，测试会清空相关表，绝不要使用生产库：

```bash
DATABASE_URL=postgresql://.../duty_day_test RUN_INTEGRATION_TESTS=1 npm test
```

覆盖轮转、奇偶成员、跳过规则、连续跳过、全星期关闭保护、时区/DST、重复调度、并发调度与通知去重。

## 健康检查与故障排查

- Web：`GET /api/health` 返回 `{"status":"ok","database":"ok"}`
- Worker：容器内 `http://localhost:3001/health`
- Dashboard 超过 5 分钟未收到心跳会显示 Warning

排查顺序：运行 `docker compose ps`，再看 `docker compose logs --tail=200 postgres migrate web worker`。数据库连接失败时检查 `DATABASE_URL`、密码和 Postgres 健康状态；Worker 正常但邮件失败时检查 Settings 的 Provider 状态和 Worker 日志。结构化日志不会输出密码或 token。

## 备份与恢复

备份：

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > duty-day.dump
```

恢复到空数据库（恢复前先备份并停止 Web/Worker）：

```bash
docker compose stop web worker
docker compose exec -T postgres dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB"
docker compose exec -T postgres createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < duty-day.dump
docker compose up -d
```

## 升级

```bash
git pull
docker compose build
docker compose run --rm migrate npx prisma migrate deploy
docker compose up -d
```

升级前先做 PostgreSQL 备份。Migration 使用 Prisma 生成并随镜像交付，Web 和 Worker 在同一镜像版本下运行。
