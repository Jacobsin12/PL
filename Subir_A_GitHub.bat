
@echo off
echo Subiendo archivos a GitHub...
cd /d "%~dp0"
git add .
git commit -m "Actualizaciones de reportes RH, correcciones y scripts de despliegue AWS"
git push -u origin main
echo.
echo Proceso finalizado.
pause
