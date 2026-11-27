# Patas & Cia

Sistema web para a Clínica Patas & Cia cadastrar tutores, animais e consultas, sem depender de um caderno.

**Site no ar:** https://patasecia-ecru.vercel.app

---

## Sobre o projeto

A Clínica Patas & Cia atende cerca de 40 animais por semana e controlava tudo em um caderno. Quando um tutor ligava para remarcar, a recepcionista precisava folhear as páginas para achar o animal, e já houve consultas marcadas em duplicidade.

Construí este sistema para resolver exatamente isso: achar um tutor ou um animal em segundos e impedir que dois atendimentos caiam no mesmo horário.

## O que o sistema faz

- **Tutores:** lista com busca (por nome do tutor, telefone ou nome do animal), cadastro, edição e exclusão.
- **Animais:** cada tutor tem a sua lista de animais, com cadastro, edição e exclusão.
- **Agenda:** marcar, remarcar, cancelar, concluir e excluir consultas. Os horários ocupados aparecem bloqueados na hora de agendar.

## Regras de validação

- Campos obrigatórios: tutor (nome e telefone), animal (nome, espécie e sexo) e consulta (animal, data, horário e motivo).
- Telefone brasileiro válido, com DDD, e sem repetir entre tutores.
- **Tutor que ainda tem animais não pode ser excluído.**
- Um animal não pode ter duas consultas no mesmo horário, e o horário da clínica também não pode ser usado duas vezes.
- Não dá para agendar no passado nem fora do expediente (08:00 às 18:00, de 30 em 30 minutos).
- Um animal com consultas agendadas ou realizadas não pode ser excluído, para preservar o histórico.

As validações acontecem no servidor, e as mensagens de erro aparecem ao lado de cada campo.

## Tecnologias

- Node.js e Express (servidor e API)
- MySQL (banco de dados), com a biblioteca `mysql2`
- HTML, CSS e JavaScript puro (telas)
- Vercel (hospedagem do site) e um MySQL na nuvem (banco em produção)

## Como rodar no seu computador

Você precisa do Node.js 18 ou superior e do MySQL 8 ou superior.

1. Baixe o projeto:
   ```
   git clone https://github.com/EduardoHspDev/patas_e_cia.git
   cd patas_e_cia
   ```
2. Crie o arquivo `.env`, copiando o `.env.example` (veja a tabela abaixo) e preenchendo com os dados do seu MySQL.
3. Crie o banco e as tabelas. No PowerShell o operador `<` não funciona, então use:
   ```
   cmd /c "mysql -u root -p < database\schema.sql"
   ```
   Se o comando `mysql` não for reconhecido, rode o script do projeto, que usa os dados do `.env`:
   ```
   npm install
   node database/criar_banco.js
   ```
4. Instale as dependências e inicie:
   ```
   npm install
   npm start
   ```
5. Abra http://localhost:3000.

## Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `PORT` | Porta do servidor (padrão 3000) |
| `DB_HOST` | Endereço do banco |
| `DB_PORT` | Porta do banco (padrão 3306) |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_NAME` | Nome do banco |
| `DB_SSL` | `true` para bancos na nuvem, que exigem conexão segura |
| `HORARIO_ABERTURA`, `HORARIO_FECHAMENTO`, `INTERVALO_MINUTOS` | Expediente da agenda (opcionais) |

O arquivo `.env` guarda senhas e **nunca deve ir para o GitHub**. Ele já está no `.gitignore`.

## Estrutura de pastas

```
patas_e_cia/
├── database/     criação das tabelas (schema.sql) e script para rodar no banco
├── public/       telas do sistema (HTML, CSS e JavaScript do navegador)
└── src/          servidor: rotas, validações e conexão com o banco
```

## API

| Recurso | Rotas principais |
|---|---|
| Tutores | `GET/POST /api/tutores`, `GET/PUT/DELETE /api/tutores/:id` |
| Animais | `GET/POST /api/tutores/:id/animais`, `GET/PUT/DELETE /api/animais/:id` |
| Consultas | `GET/POST /api/consultas`, `PUT/DELETE /api/consultas/:id`, `PATCH /api/consultas/:id/status`, `GET /api/consultas/horarios?data=` |

## Como publiquei

O site está na Vercel e o banco está em um MySQL na nuvem, porque a Vercel não consegue acessar o banco que roda no meu computador. Para isso criei o banco na nuvem, rodei o `database/criar_banco.js` apontando para ele, cadastrei as variáveis `DB_*` nas configurações da Vercel e publiquei com `vercel --prod`.

## O que aprendi no caminho

Nem tudo funcionou de primeira, e foi aí que mais aprendi:

- O PowerShell não aceita o `<` do comando do MySQL, e o `mysql` não funcionava até eu colocar a pasta `bin` dele no PATH do Windows.
- O banco da nuvem não deixa criar tabelas em qualquer banco, então precisei usar o banco liberado para o meu usuário.
- Na Vercel, o botão de *Redeploy* refaz o site com o código antigo. Para o código novo valer, foi preciso publicar de novo.
- A pasta `node_modules` foi parar no repositório no começo. Aprendi a usar o `.gitignore` e a tirá-la com `git rm -r --cached`.
- Senhas de banco não podem aparecer em prints nem no GitHub.

## Uso de inteligência artificial

Usei o Claude, uma IA da Anthropic, como apoio. Ele me ajudou a estruturar o código, explicar os erros e montar a documentação. Eu configurei o ambiente, criei e conectei o banco, fiz a publicação, testei o sistema e corrigi os problemas que apareceram pelo caminho.

## Ideias para o futuro

- Cadastro de veterinários, com a agenda separada por profissional.
- Login para a recepção.
- Histórico de consultas na tela de cada animal.
- Lembrete de consulta por mensagem.

## Autores


Eduardo Mesquita de Freitas (https://github.com/EduardoHspDev)
Julia Maia Santos (https://github.com/juliams1)
Luis Filipy Pereira de Sousa (https://github/filipysousa)
Luis Miguel Frazão de Sousa (https://github.com/luis-stat)
Rafael Maia Gomes (https://github.com/rafaelmaiads)


[Curso: ADS, disciplina: Desenvolvimento Web, instituição: UNIFOR]

