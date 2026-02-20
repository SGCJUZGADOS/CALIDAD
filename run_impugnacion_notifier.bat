@echo off
REM Script para ejecutar las notificaciones de Impugnacion/Corte SGC Envigado
REM Configurado para Windows Task Scheduler (Muestra progreso en consola y guarda log)

cd /d "%~dp0"
echo [%date% %time%] Iniciando Notificador de Impugnaciones...
powershell -Command "node js/impugnacion_notifier.js | Tee-Object -FilePath 'notifier_log.txt' -Append"
echo [%date% %time%] Finalizado.
echo ------------------------------------------
