"""Create a Telethon StringSession for a dedicated OmniMedia account."""

from getpass import getpass

from telethon.sync import TelegramClient
from telethon.sessions import StringSession


print('Use a dedicated Telegram account, not your primary personal account.')
api_id = int(input('Telegram API ID: ').strip())
api_hash = getpass('Telegram API hash: ').strip()
phone = input('Dedicated account phone number (international format): ').strip()

client = TelegramClient(StringSession(), api_id, api_hash)
try:
    client.start(phone=phone)
    print('\nTELEGRAM_SESSION (store as a secret; never commit it):')
    print(client.session.save())
finally:
    client.disconnect()
