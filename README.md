# Escalada Digital

Versão independente do Lovable do jogo **Escalada Digital — A luta diária de um DEV**.

## Stack
- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei

## Rodando localmente

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Run 4
O WORLD DEV LAB já contém a fundação jogável de locomoção:
- WASD / setas para andar
- Shift para correr
- estados IDLE / WALK / RUN
- câmera em terceira pessoa com follow suave
- colisão básica com prédios e props
- `E` para interagir
- portas da empresa e casa
- interação de teste com NPCs
- painel de debug de posição, velocidade, rotação, zona e interação próxima

## Deploy
`main` é a versão estável. O repositório está conectado à Vercel; cada push em `main` deve gerar um deploy automaticamente.

## Próximas etapas
- migrar o criador completo de avatar e catálogo de roupas
- migrar carreira, XP, energia, skills e minigames
- expandir WORLD registry para cidade/casa/empresa/interiores
- melhorar câmera orbital em terceira pessoa
- controles mobile
- sistema de save/cloud posteriormente
