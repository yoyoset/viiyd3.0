---
title: "服务标准"
date: 2026-01-17
layout: "services"
summary: "选择您的介入等级。"

# ===== Visual Configuration (Editable) =====
hero_bg: "/img/card_tiers_illustrative_v2.png"
accent_color: "gold"

hero:
  tagline: "选择您的部署等级"
  intro: "我们提供三种不同的服务等级，分别针对不同的战术需求进行优化。所有委托均包含组装、清理和精美地台制作。"

tiers:
  - id: "standard"
    name: "战场标准"
    label: "/// 等级: 标准"
    price: 5
    price_suffix: ""
    unit: "每步兵模型"
    color: "cyan"
    featured: false
    image: "https://photo.viiyd.com/2026/01/kasrkin/2026-01-14-kasrkin-01.jpg"
    features:
      - "天顶高光预制"
      - "基础色 + 渍洗"
      - "标准地台"

  - id: "elite"
    name: "阅兵标准"
    label: "/// 等级: 精锐"
    price: 15
    price_suffix: ""
    unit: "每步兵模型"
    color: "red"
    featured: true
    image: "https://photo.viiyd.com/viiyd20251203tvlotp_01.jpg"
    features:
      - "体积感光影"
      - "边缘高光"
      - "旧化效果"
      - "场景地台"

  - id: "master"
    name: "殿堂典藏"
    label: "/// 等级: 大师"
    price: 45
    price_suffix: " 起"
    unit: "每角色模型"
    color: "purple"
    featured: false
    image: "https://photo.viiyd.com/viiyd20251013lej_12.jpg"
    features:
      - "NMM (非金属金属色)"
      - "OSL (物体源光效)"
      - "手绘细节"
      - "微缩场景构图"

addons:
  - id: "prep"
    name: "模型预处理"
    desc: "去除合模线，填补缝隙，表面打磨抛光。"
    icon: "🛠️"
    color: "emerald"
    bg_image: "/img/art_green.png"
  - id: "magnet"
    name: "磁化改造"
    desc: "为武器和肢体植入磁铁，实现装备替换。"
    icon: "🧲"
    color: "cyan"
    bg_image: "/img/art_cyan.png"
  - id: "terrain"
    name: "地形定制"
    desc: "从城市废墟到异星丛林，定制专属战场。"
    icon: "🏔️"
    color: "gold"
    bg_image: "/img/art_gold.png"
  - id: "print"
    name: "3D打印服务"
    desc: "8K高精度打印，补充零件或定制代理模型。"
    icon: "🖨️"
    color: "fuchsia"
    bg_image: "/img/art_purple.png"

cta:
  text: "不确定您的需求？"
  link_text: "查看我们的作业流程 ->"
  link_url: "/zh/process"
---
