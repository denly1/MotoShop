import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState(null)
  
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  
  const { 
    register: profileRegister, 
    handleSubmit: handleProfileSubmit, 
    formState: { errors: profileErrors },
    setValue: setProfileValue
  } = useForm()
  
  const { 
    register: passwordRegister, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch
  } = useForm()
  
  // Заполнение формы профиля данными пользователя
  useEffect(() => {
    if (user) {
      setProfileValue('firstName', user.firstName || '')
      setProfileValue('lastName', user.lastName || '')
      setProfileValue('email', user.email || '')
      setProfileValue('phone', user.phone || '')
    }
  }, [user, setProfileValue])
  
  // Обработка обновления профиля
  const onProfileSubmit = async (data) => {
    try {
      setProfileLoading(true)
      setProfileError(null)
      setProfileSuccess(false)
      
      const success = await updateProfile(data)
      
      if (success) {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
      } else {
        setProfileError('Ошибка при обновлении профиля')
      }
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err)
      setProfileError('Ошибка при обновлении профиля')
    } finally {
      setProfileLoading(false)
    }
  }
  
  // Обработка смены пароля
  const onPasswordSubmit = async (data) => {
    try {
      setPasswordLoading(true)
      setPasswordError(null)
      setPasswordSuccess(false)
      
      const success = await changePassword(data.currentPassword, data.newPassword)
      
      if (success) {
        setPasswordSuccess(true)
        resetPasswordForm()
        setTimeout(() => setPasswordSuccess(false), 3000)
      } else {
        setPasswordError('Ошибка при смене пароля')
      }
    } catch (err) {
      console.error('Ошибка при смене пароля:', err)
      setPasswordError('Ошибка при смене пароля')
    } finally {
      setPasswordLoading(false)
    }
  }
  
  // Текущий новый пароль для проверки подтверждения
  const newPassword = watch('newPassword')
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Личный кабинет</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Вкладки */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'password'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('password')}
          >
            Сменить пароль
          </button>
        </div>
        
        <div className="p-6">
          {/* Форма профиля */}
          {activeTab === 'profile' && (
            <div>
              {profileSuccess && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                  Профиль успешно обновлен
                </div>
              )}
              
              {profileError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                  {profileError}
                </div>
              )}
              
              <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Имя
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className={`input ${profileErrors.firstName ? 'border-red-500' : ''}`}
                      {...profileRegister('firstName', { required: 'Введите имя' })}
                    />
                    {profileErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className={`input ${profileErrors.lastName ? 'border-red-500' : ''}`}
                      {...profileRegister('lastName', { required: 'Введите фамилию' })}
                    />
                    {profileErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="input bg-gray-100"
                      {...profileRegister('email')}
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">Email нельзя изменить</p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className={`input ${profileErrors.phone ? 'border-red-500' : ''}`}
                      {...profileRegister('phone', { 
                        pattern: {
                          value: /^[+]?[0-9]{10,15}$/,
                          message: 'Некорректный номер телефона'
                        }
                      })}
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Форма смены пароля */}
          {activeTab === 'password' && (
            <div>
              {passwordSuccess && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                  Пароль успешно изменен
                </div>
              )}
              
              {passwordError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <div className="mb-6">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Текущий пароль
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={`input ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                    {...passwordRegister('currentPassword', { 
                      required: 'Введите текущий пароль'
                    })}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Новый пароль
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={`input ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                    {...passwordRegister('newPassword', { 
                      required: 'Введите новый пароль',
                      minLength: {
                        value: 6,
                        message: 'Пароль должен содержать минимум 6 символов'
                      }
                    })}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Подтверждение пароля
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                    {...passwordRegister('confirmPassword', { 
                      required: 'Подтвердите пароль',
                      validate: value => value === newPassword || 'Пароли не совпадают'
                    })}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Изменение...' : 'Изменить пароль'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
