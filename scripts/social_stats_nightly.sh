#!/bin/bash
# 计划任务「VIIYD-social-stats」每晚 22:00 调这个（git bash 跑，ssh 推看板用的是 git bash 的 ssh 和 ~/.ssh 密钥）。
# 日志追加到 private/social/collect.log；采集失败照样出报表，看板顶部会显示「最近一笔没采到」。
cd /f/my_ai/viiyd3.0 || exit 1
export MSYS_NO_PATHCONV=1
{
    echo "=== $(date '+%F %T')"
    "/c/Program Files/nodejs/node" scripts/social_stats.js collect
    echo "exit $?"
} >> private/social/collect.log 2>&1
