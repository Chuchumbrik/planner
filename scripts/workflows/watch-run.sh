#!/usr/bin/env bash
# Watchdog для фонового Workflow-прогона (внешний монитор, дополняет встроенные
# предохранители guard() в feature-with-qa.js).
#
# Запускать в фоне (run_in_background) сразу после старта Workflow. Скрипт сам
# завершается — и тем самым шлёт уведомление запустившему — когда обнаруживает:
#   • STALL    — нет новой активности агентов дольше stall_min (среда висит/зациклилось)
#   • RUNAWAY  — агентов больше max_agents (цикл ретраев)
#   • DONE     — появился непустой output-файл задачи (прогон завершился штатно)
#   • MAXRUNTIME — сам монитор отработал предел и выходит
# По STALL/RUNAWAY запустивший должен сделать TaskStop и разобрать состояние.
#
# Usage:
#   watch-run.sh <transcript_dir> [stall_min=12] [max_agents=20] [max_runtime_min=90] [output_file]
set -u
DIR="${1:?transcript_dir required}"
STALL_MIN="${2:-12}"
MAX_AGENTS="${3:-20}"
MAX_RUNTIME_MIN="${4:-90}"
OUT="${5:-}"

started=$(date +%s)
echo "watchdog: dir=$DIR stall=${STALL_MIN}m max_agents=$MAX_AGENTS max_runtime=${MAX_RUNTIME_MIN}m"

while true; do
  sleep 60
  now=$(date +%s)

  # Штатное завершение прогона — output-файл стал непустым.
  if [ -n "$OUT" ] && [ -s "$OUT" ]; then
    echo "DONE: output present ($OUT) — прогон завершён, монитор выходит"; exit 0
  fi

  newest=$(find "$DIR" -maxdepth 1 -name '*.jsonl' -printf '%T@\n' 2>/dev/null | sort -nr | head -1 | cut -d. -f1)
  agents=$(find "$DIR" -maxdepth 1 -name '*.meta.json' 2>/dev/null | wc -l)
  elapsed=$(( now - started ))

  if [ -z "$newest" ]; then
    [ "$elapsed" -gt $((MAX_RUNTIME_MIN*60)) ] && { echo "TIMEOUT: каталог пуст ${MAX_RUNTIME_MIN}m, выходим"; exit 4; }
    continue
  fi

  idle=$(( now - newest ))

  if [ "$agents" -gt "$MAX_AGENTS" ]; then
    echo "RUNAWAY: агентов $agents (> $MAX_AGENTS) — вероятен цикл ретраев. Нужен TaskStop. dir=$DIR"; exit 3
  fi
  if [ "$idle" -gt $((STALL_MIN*60)) ]; then
    echo "STALL: нет активности ${idle}s (> ${STALL_MIN}m), агентов=$agents. Нужен TaskStop. dir=$DIR"; exit 2
  fi
  if [ "$elapsed" -gt $((MAX_RUNTIME_MIN*60)) ]; then
    echo "MAXRUNTIME: монитор отработал ${MAX_RUNTIME_MIN}m (агентов=$agents, idle=${idle}s), выходим"; exit 5
  fi
done
