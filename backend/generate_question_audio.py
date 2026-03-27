"""One-time script to generate MP3 audio files for the 12 sample interview questions.

Uses edge-tts (Microsoft Edge Neural TTS) which has native Mongolian voices:
  - mn-MN-BataaNeural (Male)
  - mn-MN-YesuiNeural (Female)

Output: frontend/public/audio/q1.mp3 through q12.mp3
"""

import asyncio
import os
import edge_tts

VOICE = "mn-MN-YesuiNeural"  # Female Mongolian voice

QUESTIONS = [
    "Та өөрийгөө танилцуулна уу.",
    "Яагаад энэ ажлын байранд сонирхолтой байна вэ?",
    "Таны давуу тал юу вэ?",
    "Таны сул тал юу вэ?",
    "Багаар хэрхэн ажилладаг вэ?",
    "Хүнд нөхцөл байдлыг хэрхэн шийдвэрлэсэн тухайгаа ярина уу.",
    "5 жилийн дараа өөрийгөө хаана харж байна вэ?",
    "Яагаад өмнөх ажлаасаа гарсан бэ?",
    "Цалингийн хүлээлт хэд вэ?",
    "Та стресстэй нөхцөлд хэрхэн ажилладаг вэ?",
    "Танд бидэнд асуух зүйл байна уу?",
    "Өмнөх туршлагаасаа ярина уу.",
]

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "frontend", "public", "audio"
)


async def generate_audio(text: str, filepath: str):
    communicate = edge_tts.Communicate(text, VOICE, rate="-10%")
    await communicate.save(filepath)


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for i, question in enumerate(QUESTIONS, start=1):
        filename = f"q{i}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        print(f"Generating {filename}: {question}")
        await generate_audio(question, filepath)

    print(f"\nDone! Generated {len(QUESTIONS)} audio files in {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
