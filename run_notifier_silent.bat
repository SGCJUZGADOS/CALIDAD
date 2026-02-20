@echo off
REM Script para ejecutar las notificaciones de Tutelas y Demandas SGC Envigado
REM Configurado para Windows Task Scheduler (NO AGREGAR PAUSE)

cd /d "%~dp0"
echo [%date% %time%] Iniciando Notificador de Tutelas y Demandas... >> tutelas_demandas_notifier_log.txt
node js/notifier.js >> tutelas_demandas_notifier_log.txt 2>&1
echo [%date% %time%] Finalizado. >> tutelas_demandas_notifier_log.txt
echo ------------------------------------------ >> tutelas_demandas_notifier_log.txt
