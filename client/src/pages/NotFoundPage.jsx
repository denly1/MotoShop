import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Страница не найдена</h2>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Страница, которую вы ищете, не существует или была перемещена.
      </p>
      <div className="flex space-x-4">
        <Link to="/" className="btn btn-primary">
          Вернуться на главную
        </Link>
        <Link to="/catalog" className="btn btn-outline">
          Перейти в каталог
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
