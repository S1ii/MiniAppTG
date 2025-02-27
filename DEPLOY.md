# Полная инструкция по деплою

## 1. Подготовка сервера

1. Подключитесь к серверу по SSH:
```bash
ssh root@ваш_ip
```

2. Обновите систему:
```bash
apt update && apt upgrade -y
```

3. Установите необходимые пакеты:
```bash
apt install -y git curl nano
```

4. Установите Docker и Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin
```

5. Установите Certbot для SSL-сертификата:
```bash
sudo apt-get install certbot -y
```

## 2. Настройка домена

1. В панели управления доменом создайте A-записи:
```
gossipbot.social     A     ваш_ip
www.gossipbot.social CNAME gossipbot.social
```

2. Проверьте что DNS обновился:
```bash
ping gossipbot.social
```

## 3. Настройка SSL

1. Остановите все сервисы на 80 порту:
```bash
sudo lsof -i :80
sudo kill -9 <PID>
```

2. Получите SSL-сертификат:
```bash
sudo certbot certonly --standalone -d gossipbot.social -d www.gossipbot.social
```

## 4. Установка приложения

1. Создайте директорию для проекта:
```bash
mkdir -p /root/gossipbot
cd /root/gossipbot
```

2. Склонируйте репозиторий:
```bash
git clone ваш_репозиторий .
```

3. Создайте директорию для SSL и скопируйте сертификаты:
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/gossipbot.social/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/gossipbot.social/privkey.pem ssl/
sudo chmod 644 ssl/*
```

4. Создайте файл `.env`:
```bash
cat > .env << EOL
MONGODB_URI=mongodb://mongodb:27017/gossip
DATABASE_URL=mongodb://mongodb:27017/gossip
BOT_TOKEN=ваш_токен_бота
WEBAPP_URL=https://gossipbot.social
NEXT_PUBLIC_WS_URL=wss://gossipbot.social
EOL
```

## 5. Запуск приложения

1. Соберите и запустите контейнеры:
```bash
docker-compose up -d
```

2. Проверьте что все контейнеры запустились:
```bash
docker-compose ps
```

3. Проверьте логи на наличие ошибок:
```bash
docker-compose logs -f
```

## 6. Настройка Telegram бота

1. Откройте чат с @BotFather
2. Отправьте команду /mybots
3. Выберите вашего бота
4. Нажмите "Bot Settings" -> "Menu Button"
5. Установите URL веб-приложения:
   ```
   https://gossipbot.social
   ```

## 7. Проверка работоспособности

1. Откройте в браузере:
```
https://gossipbot.social
```

2. Проверьте редирект с www:
```
https://www.gossipbot.social
```

3. Проверьте бота в Telegram

## 8. Автоматическое обновление SSL

1. Создайте скрипт для обновления сертификатов:
```bash
cat > /root/renew-ssl.sh << EOL
#!/bin/bash
certbot renew
cp /etc/letsencrypt/live/gossipbot.social/fullchain.pem /root/gossipbot/ssl/
cp /etc/letsencrypt/live/gossipbot.social/privkey.pem /root/gossipbot/ssl/
chmod 644 /root/gossipbot/ssl/*
docker-compose -f /root/gossipbot/docker-compose.yml restart nginx
EOL
```

2. Сделайте скрипт исполняемым:
```bash
chmod +x /root/renew-ssl.sh
```

3. Добавьте задачу в crontab:
```bash
(crontab -l 2>/dev/null; echo "0 0 1 * * /root/renew-ssl.sh") | crontab -
```

## 9. Бэкап базы данных

1. Создайте скрипт для бэкапа:
```bash
cat > /root/backup-db.sh << EOL
#!/bin/bash
DATE=\$(date +%Y%m%d)
docker-compose -f /root/gossipbot/docker-compose.yml exec -T mongodb mongodump --out /data/db/backup-\$DATE
EOL
```

2. Сделайте скрипт исполняемым:
```bash
chmod +x /root/backup-db.sh
```

3. Добавьте ежедневный бэкап в crontab:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup-db.sh") | crontab -
```

## 10. Обновление приложения

1. Остановите контейнеры:
```bash
cd /root/gossipbot
docker-compose down
```

2. Получите последние изменения:
```bash
git pull
```

3. Пересоберите и запустите контейнеры:
```bash
docker-compose up -d --build
```

## 11. Мониторинг

- Просмотр всех логов:
```bash
docker-compose logs -f
```

- Просмотр логов конкретного сервиса:
```bash
docker-compose logs -f webapp
docker-compose logs -f bot
docker-compose logs -f nginx
```

- Проверка статуса контейнеров:
```bash
docker-compose ps
```

## 12. Решение проблем

1. Если не работает SSL:
```bash
certbot certificates
docker-compose logs nginx
```

2. Если не работает MongoDB:
```bash
docker-compose logs mongodb
docker-compose exec mongodb mongosh
```

3. Если не работает бот:
```bash
docker-compose logs bot
```

4. Если не работает веб-приложение:
```bash
docker-compose logs webapp
```

## 13. Важные замечания

1. Регулярно проверяйте:
   - Логи на наличие ошибок
   - Свободное место на диске
   - Статус SSL сертификатов
   - Наличие бэкапов

2. Настройте файрвол:
```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

3. Настройте автоматические обновления безопасности:
```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```