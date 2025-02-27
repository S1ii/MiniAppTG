import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Удаляем записи из таблиц в правильном порядке (из-за внешних ключей)
    console.log('Очистка базы данных...');
    
    // Сначала удаляем лайки и комментарии, так как они зависят от сплетен
    await prisma.like.deleteMany();
    console.log('✓ Лайки удалены');
    
    await prisma.comment.deleteMany();
    console.log('✓ Комментарии удалены');
    
    // Затем удаляем сплетни
    await prisma.gossip.deleteMany();
    console.log('✓ Сплетни удалены');

    console.log('База данных успешно очищена!');
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase(); 