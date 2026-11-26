# SIGAE WEB
### Sistema Inteligente de Gerenciamento de Atendimentos de Emergência

<p align="center">
  Sistema web acadêmico para gerenciamento de pacientes, classificação de risco, organização de filas de atendimento e distribuição de médicos.
</p>

---

## 1. Sobre o projeto

O **SIGAE WEB** é um sistema desenvolvido com o objetivo de organizar e facilitar o gerenciamento de atendimentos em unidades de emergência.

A proposta surgiu da necessidade de melhorar o controle dos pacientes que chegam à unidade, considerando a classificação de risco, o horário de chegada e a disponibilidade dos médicos.

O sistema utiliza estruturas de dados implementadas em JavaScript para organizar a fila de prioridade e permitir a consulta eficiente dos pacientes cadastrados.

O projeto foi desenvolvido como atividade acadêmica da disciplina de Estrutura de Dados, aplicando na prática conceitos estudados durante o curso.

## 2. Objetivos

- Organizar os pacientes de acordo com a classificação de risco.
- Respeitar a ordem de chegada em casos de prioridades iguais.
- Facilitar a localização de pacientes por meio de identificadores.
- Distribuir os atendimentos entre os médicos disponíveis.
- Controlar o andamento dos atendimentos.
- Registrar as movimentações realizadas no sistema.
- Aplicar estruturas de dados na resolução de um problema prático.

## 3. Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e responsividade |
| JavaScript | Regras de negócio e funcionalidades |
| LocalStorage | Armazenamento local dos dados |
| GitHub | Versionamento e hospedagem do projeto |
| GitHub Pages | Publicação da aplicação web |

## 4. Estruturas de dados implementadas

O desenvolvimento utiliza duas estruturas principais, implementadas pela própria equipe em JavaScript, sem depender de bibliotecas prontas para essas operações.

### 4.1. Tabela Hash

A Tabela Hash é utilizada para armazenar e localizar pacientes por meio de seus identificadores.

Sua implementação utiliza:

- Tamanho inicial de 53 posições.
- Função Hash baseada no identificador do paciente.
- Tratamento de colisões por encadeamento separado.
- Operações de inserção, busca e remoção.

A busca apresenta custo esperado de **O(1)**, podendo chegar a **O(n)** no pior caso, dependendo da ocorrência de colisões.

### 4.2. Heap Binária

A Heap Binária mínima é utilizada para organizar a fila de prioridade dos pacientes.

A ordem de atendimento considera três critérios:

1. Menor número de risco, ou seja, maior gravidade.
2. Horário de chegada mais antigo.
3. Menor identificador do paciente.

Principais operações:

- Inserção de pacientes.
- Remoção do paciente prioritário.
- Remoção de um paciente específico.
- Visualização da fila ordenada sem modificar a estrutura original.

A inserção e a remoção do paciente prioritário possuem custo **O(log n)**. A consulta ao primeiro elemento possui custo **O(1)**.

## 5. Regras de funcionamento

### Classificação de risco

| Nível | Classificação |
|---|---|
| 1 | Emergência |
| 2 | Muito urgente |
| 3 | Urgente |
| 4 | Pouco urgente |
| 5 | Não urgente |

Quanto menor o número, maior é a prioridade do paciente.

### Distribuição dos médicos

A seleção do médico disponível considera:

1. Menor quantidade de consultas concluídas.
2. Maior tempo desde a última atribuição.
3. Menor identificador do médico.

A seleção percorre a lista de médicos disponíveis, com custo **O(m)**, sendo *m* a quantidade de médicos cadastrados.

Um médico ocupado não recebe outro paciente até que seu atendimento seja finalizado ou cancelado.

## 6. Funcionalidades

O sistema apresenta as seguintes funcionalidades:

- Cadastro de pacientes com identificação automática.
- Classificação de risco de 1 a 5.
- Consulta de pacientes pelo identificador.
- Pesquisa de pacientes por nome ou código.
- Reclassificação de pacientes que ainda aguardam atendimento.
- Organização automática da fila de prioridade.
- Cadastro de médicos e especialidades.
- Controle de disponibilidade dos médicos.
- Chamada do próximo paciente.
- Início do atendimento.
- Conclusão do atendimento.
- Cancelamento de atendimentos.
- Desfazer chamadas ainda não iniciadas.
- Histórico de movimentações.
- Consulta de atendimentos concluídos.
- Contagem de consultas concluídas por médico.
- Painel com indicadores de pacientes e médicos.

## 7. Armazenamento dos dados

O SIGAE WEB utiliza o **LocalStorage** do navegador para armazenar os dados cadastrados.

A chave utilizada para persistência é:

`sigae_web_dados_v1`

Dessa forma, os dados podem permanecer disponíveis quando o usuário fecha e abre novamente a aplicação no mesmo navegador.

**Observação:** o projeto utiliza armazenamento local e não possui, nesta versão, um banco de dados em servidor. Os dados não são compartilhados automaticamente entre diferentes dispositivos ou navegadores.

## 8. Como executar o projeto

### Acesso pela internet

A aplicação está publicada pelo GitHub Pages:

**https://andreollyduarte.github.io/SIGAE-WEB/**

Basta acessar o endereço pelo navegador.

### Execução local

1. Baixe ou clone o repositório.
2. Extraia a pasta do projeto, caso tenha baixado o arquivo ZIP.
3. Localize o arquivo `index.html`.
4. Abra o arquivo em um navegador atualizado.

Não é necessário instalar dependências ou configurar um servidor para a execução local desta versão.

## 9. Organização dos arquivos

```text
SIGAE-WEB/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
└── Documentacao_SIGAE_WEB_Andreolly_Duarte.pdf
```

- **index.html:** estrutura da aplicação.
- **style.css:** estilos e organização visual.
- **script.js:** estruturas de dados, regras de negócio e funcionalidades.
- **README.md:** apresentação e instruções do projeto.
- **Documentação em PDF:** material acadêmico complementar.

## 10. Análise de complexidade

| Operação | Complexidade |
|---|---|
| Busca esperada na Tabela Hash | O(1) |
| Busca no pior caso da Hash | O(n) |
| Inserção na Heap | O(log n) |
| Remoção prioritária na Heap | O(log n) |
| Consulta ao primeiro da Heap | O(1) |
| Remoção por ID na Heap | O(n) |
| Visualização ordenada da fila | O(n log n) |
| Seleção de médico disponível | O(m) |

Onde:

- **n:** quantidade de pacientes na fila ou estrutura.
- **m:** quantidade de médicos cadastrados.

Os custos apresentados consideram as operações das estruturas e dos algoritmos implementados.

## 11. Testes e validação

A validação do projeto deve considerar cenários como:

- Cadastro de pacientes com diferentes classificações de risco.
- Pacientes com o mesmo nível de prioridade.
- Desempate pelo horário de chegada e identificador.
- Reclassificação de pacientes sem duplicidade na fila.
- Chamada de pacientes com médicos disponíveis.
- Tentativa de chamada sem médicos disponíveis.
- Distribuição entre médicos com quantidades iguais de consultas concluídas.
- Cancelamento e desfazer chamada.
- Conclusão de atendimento e atualização da contagem do médico.
- Persistência dos dados após atualizar a página.

Os resultados e as evidências dos testes devem ser apresentados na documentação acadêmica complementar, conforme a execução e validação de cada cenário.

## 12. Publicação

O projeto utiliza o GitHub para armazenamento e controle de versões do código-fonte.

A aplicação foi publicada por meio do GitHub Pages, permitindo o acesso ao sistema diretamente pelo navegador.

**Repositório:**  
https://github.com/andreollyduarte/SIGAE-WEB

**Aplicação publicada:**  
https://andreollyduarte.github.io/SIGAE-WEB/

---

## 13. Identificação acadêmica

**Aluno:** Andreolly de Paulo Duarte  
**Matrícula:** 202515551  
**Instituição:** Universidade de Vassouras – Campus Maricá  
**Curso:** Engenharia de Software  
**Disciplina:** Estrutura de Dados  
**Professor:** Márcio Garrido

---

*Projeto acadêmico desenvolvido para aplicação prática dos conceitos de Estrutura de Dados, com foco na organização de filas de prioridade, busca de informações e gerenciamento de atendimentos de emergência.*
