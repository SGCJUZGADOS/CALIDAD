@echo off
REM Script para ejecutar las notificaciones de Impugnacion/Corte SGC Envigado
REM Configurado para Windows Task Scheduler

cd /d "%~dp0"
echo [%date% %time%] Iniciando Notificador de Impugnaciones... >> notifier_log.txt
node js/impugnacion_notifier.js >> notifier_log.txt 2>&1
echo [%date% %time%] Finalizado. >> notifier_log.txt
echo ------------------------------------------ >> notifier_log.txt
