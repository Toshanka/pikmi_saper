import asyncio
import json
import logging
import os

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup, WebAppInfo


TOKEN = os.getenv("BOT_TOKEN", "").strip()
WEB_APP_URL = os.getenv("WEB_APP_URL", "").strip()
dp = Dispatcher()


def game_keyboard() -> ReplyKeyboardMarkup:
	return ReplyKeyboardMarkup(
		keyboard=[[KeyboardButton(text="🎮 Открыть сапёр", web_app=WebAppInfo(url=WEB_APP_URL))]],
		resize_keyboard=True,
		is_persistent=True,
	)


@dp.message(CommandStart())
async def start_handler(message: Message) -> None:
	await message.answer(
		"💗 Добро пожаловать в мини-игру!\n\n"
		"Открой сапёр и проверь, насколько сегодня удача на твоей стороне.",
		reply_markup=game_keyboard(),
	)


@dp.message(Command("game"))
async def game_handler(message: Message) -> None:
	await message.answer("🎮 Игра готова. Нажми кнопку ниже.", reply_markup=game_keyboard())


@dp.message(F.web_app_data)
async def web_app_data_handler(message: Message) -> None:
	try:
		data = json.loads(message.web_app_data.data)
		result = data.get("result", "Игра завершена!")
	except (AttributeError, json.JSONDecodeError, TypeError):
		result = "Игра завершена!"

	await message.answer(f"🏁 {result}", reply_markup=game_keyboard())


async def main() -> None:
	if not TOKEN:
		raise RuntimeError("Не задан BOT_TOKEN.")
	if not WEB_APP_URL.startswith(("https://", "http://localhost")):
		raise RuntimeError("Задай WEB_APP_URL с HTTPS-адресом опубликованной Mini App.")

	logging.basicConfig(level=logging.INFO)
	bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
	try:
		await dp.start_polling(bot)
	finally:
		await bot.session.close()


if __name__ == "__main__":
	asyncio.run(main())
