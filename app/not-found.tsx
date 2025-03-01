import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Страница не найдена</h2>
      <p className="mb-4">Запрашиваемая страница не существует</p>
      <Link 
        href="/" 
        className="text-blue-500 hover:text-blue-700 underline"
      >
        Вернуться на главную
      </Link>
    </div>
  )
} 