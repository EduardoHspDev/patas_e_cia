# Patas & Cia — Cadastro de Tutores e Animais

Stack: Node.js + Express, MySQL (mysql2), HTML, CSS e JavaScript puro.

## Como rodar
1. Instale Node 18+ e MySQL 8+.
2. Crie o banco: `mysql -u root -p < database/schema.sql`
3. `cp .env.example .env` e ajuste usuário/senha do MySQL.
4. `npm install`
5. `npm start` e abra http://localhost:3000

## API
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/tutores?busca= | Lista tutores (busca por tutor, telefone ou animal) |
| GET/POST | /api/tutores, /api/tutores/:id | Buscar / criar |
| PUT/DELETE | /api/tutores/:id | Atualizar / excluir (409 se tiver animais) |
| GET/POST | /api/tutores/:id/animais | Listar / criar animais do tutor |
| GET/PUT/DELETE | /api/animais/:id | Buscar / atualizar / excluir animal |

## Regras de validação (backend e mensagens no front)
- Obrigatórios — Tutor: nome, telefone. Animal: nome, espécie, sexo.
- Telefone brasileiro válido (DDD + 8 ou 9 dígitos), salvo só com números e único por tutor.
- Tutor com animais não pode ser excluído (checagem na API + FOREIGN KEY ... RESTRICT).

## Agenda de consultas (anti-duplicidade)
Banco já existente? Rode também `database/migracao_consultas.sql`.

| Método | Rota | Descrição |
|---|---|---|
| GET | /api/consultas?data=&animal_id=&status= | Lista consultas |
| GET | /api/consultas/horarios?data= | Horários do dia (livres/ocupados) |
| POST | /api/consultas | Agenda (animal_id, data, hora, motivo, observacoes) |
| PUT | /api/consultas/:id | Remarca/edita (só consultas agendadas) |
| PATCH | /api/consultas/:id/status | agendada / realizada / cancelada |
| DELETE | /api/consultas/:id | Exclui |

Regras: horário dentro do expediente (`.env`: HORARIO_ABERTURA, HORARIO_FECHAMENTO, INTERVALO_MINUTOS);
sem agendar no passado; um animal não pode ter duas consultas no mesmo horário; a clínica atende
um paciente por horário. Cancelar ou concluir libera o horário. A regra é garantida também pelo
índice único `uq_consulta_horario`, que protege contra duas recepcionistas agendando ao mesmo tempo.
Animal com consultas agendadas/realizadas não pode ser excluído.
