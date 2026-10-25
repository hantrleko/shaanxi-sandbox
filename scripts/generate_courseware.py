#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动化课件数据与语音批量生成流水线 (AI Content Pipeline)
==============================================================
该脚本展示了视频作者“人 8 小时 + AI 50 小时”生产数百个段落的核心工作流：
1. 大模型结构化提示词模版 (Prompt Template) 批量生成各章节 JSON 数据
2. 使用微软 edge-tts 批量合成高质量真人朗读语音 (MP3) 并导出对应字幕时间戳
"""

import os
import json
import asyncio

# 微软高质自然中文语音 (如: zh-CN-YunxiNeural 男声沉稳解说, zh-CN-XiaoxiaoNeural 亲切女声)
VOICE_NAME = "zh-CN-YunxiNeural"

AI_PROMPT_TEMPLATE = """
你是一位专业的地理历史互动课件设计师。
请为《陕西地理人文沙盘》生成下一个章节的结构化数据，严格输出为以下 JSON 格式：

{
  "id": "geo_07",
  "num": "07",
  "title": "章节主标题",
  "subTitle": "副标题 · 核心提炼",
  "timeBadge": "时代或地理指标",
  "highlight": "核心要点一句话",
  "desc": "详细科普文案（约120-180字），语言生动、科学严谨，适合配音播放。",
  "camera": {
    "pos": [0, 40, 30],
    "target": [0, 0, 0],
    "pitch": 25
  },
  "diagramTitle": "配套剖面或示意图标题",
  "diagramType": "profile_type",
  "photoCaption": "实景图片说明"
}
"""

async def generate_speech_for_text(text: str, output_path: str):
    """
    通过 edge-tts 将讲解文本批量合成为 MP3 音频
    安装依赖: pip install edge-tts
    """
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, VOICE_NAME, rate="+0%", pitch="+0Hz")
        await communicate.save(output_path)
        print(f"[OK] 生成语音成功: {output_path}")
    except ImportError:
        print("[提示] 本地未安装 edge-tts，如需批量生成离线语音文件，请运行: pip install edge-tts")
    except Exception as e:
        print(f"[错误] 生成语音失败: {e}")

def main():
    print("=" * 60)
    print("陕西地理沙盘 AI 批量课件生产流水线示例")
    print("=" * 60)
    print("\n1. 大模型批量生成 Prompt 模版已就绪。")
    print("2. 您可以将生成好的 JSON 节点追加到 src/data/shaanxiData.js 中。")
    print("3. 前端播放引擎将自动识别并渲染新增的镜头、卡片与语音。")

if __name__ == "__main__":
    main()
