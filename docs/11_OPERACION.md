# 11. Guía de Operaciones, Hardening y Mantenimiento

> **Infraestructura:** VPS Contabo IP `178.238.238.158` & Vercel Edge Network  
> **Acceso SSH:** Llave privada ed25519 (`antigravity_vps_key`)

---

## 1. Hardening y Seguridad de Puertos en Docker

Docker por defecto altera las cadenas de `iptables` e ignora el firewall `ufw` al publicar puertos como `8083:8083`. Para garantizar que ningún servicio interno quede expuesto a internet:

En `docker-compose.yml`, los puertos deben mapearse estrictamente a la interfaz loopback local:
```yaml
ports:
  - "127.0.0.1:8083:8083" # WhatsApp Worker
  - "127.0.0.1:8080:8080" # Evolution API
  - "127.0.0.1:8092:8092" # Hermes Agent
```

---

## 2. Comandos Operativos de Diagnóstico

```bash
# Conexión SSH
ssh -i "D:\Abel paginas\VPS CONTABO\antigravity_vps_key" root@178.238.238.158

# Ver consumo de recursos de los contenedores
docker stats --no-stream

# Monitorear logs del WhatsApp Worker
docker logs -f whatsapp-worker --tail 100

# Reiniciar el Worker tras cambios en lib/
docker restart whatsapp-worker

# Monitorear logs de Hermes Director
docker logs -f agenda-cultural-bot --tail 100
```

---

## 3. Políticas de Respaldos (Backups)

1. **Base de Datos MariaDB:** Snapshots diarios gestionados en StackCP + volcado lógico periódico con `mysqldump`.
2. **Sesiones de WhatsApp (Evolution API):** Volumen persistente Docker en `/root/.../evolution_instances` para evitar perder el escaneo QR de la cuenta.
3. **Afiches y Multimedia:** Replicación en Bunny CDN con almacenamiento distribuido.
