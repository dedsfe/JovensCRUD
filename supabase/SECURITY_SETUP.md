# Ativação da segurança

Esta migration cria perfis de acesso, o cadastro dos jovens, fotos privadas e
políticas RLS. Toda conta nova começa como `member` e `pending`.

Os cargos disponíveis são:

- `member`: acessa somente os recursos liberados para um membro.
- `leader`: gerencia o diretório dos jovens, sem administrar acessos.
- `admin`: gerencia o diretório, aprova contas e altera cargos.

O cargo e o status são definidos pelo trigger do banco. Valores enviados pelo
cadastro, inclusive em `user_metadata`, não são usados para conceder acesso.

## Aplicar

Abra o SQL Editor do projeto Supabase e execute o conteúdo de:

`supabase/migrations/20260915150000_secure_auth_and_youth.sql`

Alternativamente, autentique o CLI com uma conta que tenha acesso ao projeto,
faça o link e execute `supabase db push`.

## Ativar o primeiro administrador

Para não expor um endereço pessoal no repositório público, o primeiro
administrador é ativado por uma operação única no SQL Editor. Crie a conta,
confirme o e-mail e execute, substituindo o marcador pelo endereço confirmado:

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = (
  select id
  from auth.users
  where lower(email) = lower('EMAIL_DO_PRIMEIRO_ADMIN')
    and email_confirmed_at is not null
);
```

Se o comando não alterar nenhuma linha, confirme primeiro o endereço de e-mail
da conta. Não remova a condição `email_confirmed_at is not null`.

Não coloque chaves secretas, `service_role` ou tokens pessoais em arquivos
`VITE_*`. Tudo que começa com `VITE_` é entregue ao navegador.
