@echo off
echo Creating .env file for backend...

(
echo PORT=3000
echo.
echo # Mail.ru SMTP Configuration
echo SMTP_HOST=smtp.mail.ru
echo SMTP_PORT=465
echo SMTP_SECURE=true
echo SMTP_USER=smptxxxpocta@mail.ru
echo SMTP_PASS=uwshky0GrHWv0xu1VjWJ
echo.
echo # Email settings
echo EMAIL_FROM=smptxxxpocta@mail.ru
echo EMAIL_TO=smptxxxpocta@mail.ru
) > server\.env

echo.
echo ✅ File server\.env created successfully!
echo.
pause

