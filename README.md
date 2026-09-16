# JovensCRUD

Diretório mobile-first para organizar os jovens da igreja.

## Estado atual

Aplicação conectada ao Supabase com autenticação, níveis de acesso, diretório de
jovens, fotos privadas, ficha pastoral, observações, aniversários e campos
personalizados administráveis sem alteração de código.

## Desenvolvimento

```bash
npm install
npm run dev
```

Verificações:

```bash
npm run lint
npm run build
```

## Tecnologias

- React
- TypeScript
- Vite
- CSS Modules
- Motion

## Banco de dados

As alterações de estrutura e segurança ficam em `supabase/migrations`. Em um
projeto Supabase vinculado, aplique as migrations pendentes com:

```bash
supabase db push
```
