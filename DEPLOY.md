# Инструкция по деплою

## Требования к домену

Для работы Telegram WebApp обязательно требуется домен и HTTPS. Использовать IP-адрес напрямую нельзя.

Варианты получения домена:

1. **Платный домен (рекомендуется):**
   - Регистраторы: REG.RU, RU-CENTER, Namecheap
   - Примерная стоимость: от 100-200 рублей в год
   - Подходящие зоны: .ru, .xyz, .site, .online

2. **Бесплатный домен (для тестирования):**
   - DuckDNS.org: бесплатные поддомены вида your-name.duckdns.org
   - Freenom.com: бесплатные домены в зонах .tk, .ml, .ga, .cf, .gq

После получения домена:
1. Создайте A-запись, указывающую на IP вашего сервера
2. Дождитесь обновления DNS (может занять до 24 часов)
3. Используйте домен в дальнейших настройках

## Подготовка сервера

1. Установите Docker и Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin
```

2. Установите Certbot для SSL-сертификата:
```bash
sudo apt-get update
sudo apt-get install certbot
```

3. Получите SSL-сертификат:
```bash
sudo certbot certonly --standalone -d gossipbot.social -d www.gossipbot.social
```

4. Создайте директорию для SSL и скопируйте сертификаты:
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/gossipbot.social/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/gossipbot.social/privkey.pem ssl/
```

## Настройка окружения

1. Создайте файл `.env` в корневой директории:
```bash
MONGODB_URI=mongodb://mongodb:27017/gossip
DATABASE_URL=mongodb://mongodb:27017/gossip
BOT_TOKEN=your_bot_token
WEBAPP_URL=https://gossipbot.social
NEXT_PUBLIC_WS_URL=wss://gossipbot.social
```

2. Замените `your-domain.com`