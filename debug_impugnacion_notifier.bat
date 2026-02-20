@echo off
REM Script para ejecutar las notificaciones de Impugnacion/Corte SGC Envigado
REM CONSOLA PARA PRUEBAS MANUALES

cd /d "%~dp0"
echo [%date% %time%] Iniciando Notificador de Impugnaciones (MODO PRUEBA)...
node js/impugnacion_notifier.js
echo.
echo [%date% %time%] Finalizado.
echo ------------------------------------------
pause
