# Sistema de Classificação de Risco Pediátrico

## Descrição do Projeto

O projeto consiste no desenvolvimento de um sistema de classificação de risco pediátrico para o **Hospital Municipal Getúlio Vargas Filho**, com o objetivo de auxiliar os profissionais de saúde no registro, na organização e na consulta dos atendimentos realizados.

O sistema permite cadastrar pacientes de 0 a 14 anos, registrar informações relacionadas ao atendimento e selecionar a classificação de risco correspondente, de acordo com os parâmetros disponíveis no sistema. Também possibilita o acompanhamento do histórico de atendimentos, permitindo consultar os registros e identificar o profissional responsável por cada atendimento.

A aplicação conta com diferentes níveis de acesso, destinados aos usuários Administrador e Enfermeiro, garantindo que cada perfil tenha acesso às funcionalidades correspondentes às suas responsabilidades.

## Tecnologias Utilizadas

- **Python:** linguagem de programação utilizada no desenvolvimento do sistema.
- **Django:** framework utilizado no desenvolvimento do back-end.
- **HTML5:** estruturação das páginas.
- **CSS3:** estilização e organização visual da interface.
- **JavaScript:** funcionalidades e interações do front-end.
- **PostgreSQL:** sistema de gerenciamento do banco de dados.
- **Visual Studio Code:** ambiente de desenvolvimento.
- **Render:** plataforma utilizada para hospedagem da aplicação.

## Funcionalidades

- Autenticação de usuários por meio de login.
- Gerenciamento de usuários pelo Administrador.
- Cadastro de pacientes pediátricos.
- Registro de atendimentos e classificação de risco.
- Consulta ao histórico de atendimentos.
- Gerenciamento das classificações de risco e seus respectivos parâmetros.
- Configuração das regras e faixas etárias.
- Controle de acesso conforme o tipo de usuário.

## Tipos de Usuário

**Administrador:**
- Gerenciar usuários do sistema.
- Consultar e alterar parâmetros de classificação.
- Gerenciar regras e faixas etárias.
- Acessar as funcionalidades administrativas.

**Enfermeiro:**
- Cadastrar pacientes.
- Registrar atendimentos.
- Selecionar a classificação de risco.
- Consultar o histórico de atendimentos.

## Instruções de Uso

O usuário deverá acessar o sistema por meio do link disponibilizado e realizar o login utilizando suas credenciais.

Após a autenticação, as funcionalidades disponíveis serão determinadas pelo tipo de usuário.

O Enfermeiro poderá cadastrar pacientes, informando dados como nome, prontuário, idade, sexo e responsável. Em seguida, poderá registrar o atendimento, preencher as informações solicitadas e selecionar a classificação de risco correspondente.

Após salvar o atendimento, as informações ficarão registradas no banco de dados e poderão ser consultadas posteriormente no histórico, juntamente com a identificação do profissional responsável.

O Administrador terá acesso às funcionalidades de gerenciamento de usuários, classificações, parâmetros, regras e faixas etárias, podendo realizar as configurações necessárias para o funcionamento do sistema.

**Observação:** A seleção da classificação de risco é realizada manualmente pelo profissional. Os parâmetros e regras cadastrados servem para a configuração do sistema, mas não realizam classificação automática nem substituem a avaliação profissional.

## Acesso ao Sistema

[https://classificacao-risco-mylj.onrender.com/](https://classificacao-risco-mylj.onrender.com/)

## Instituição

Projeto acadêmico desenvolvido no curso de Sistemas de Informação da UniLaSalle-RJ.
