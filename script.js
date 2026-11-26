
"use strict";

/* =====================================================
   SIGAE WEB
   Sistema Inteligente de Gerenciamento de Atendimentos
   Estruturas implementadas: Tabela Hash e Heap Binário.
===================================================== */


/* =====================================================
   1. TABELA HASH
   Busca pacientes pelo ID.
   Colisões: encadeamento separado.
===================================================== */

class TabelaHash {
    constructor(tamanho = 53) {
        this.tamanho = tamanho;
        this.tabela = Array.from({ length: tamanho }, () => []);
    }

    funcaoHash(chave) {
        return Math.abs(Number(chave)) % this.tamanho;
    }

    inserir(chave, valor) {
        const lista = this.tabela[this.funcaoHash(chave)];
        const existente = lista.find(item => item.chave === chave);

        if (existente) {
            existente.valor = valor;
        } else {
            lista.push({ chave, valor });
        }
    }

    buscar(chave) {
        const lista = this.tabela[this.funcaoHash(chave)];
        return lista.find(item => item.chave === chave)?.valor ?? null;
    }

    remover(chave) {
        const lista = this.tabela[this.funcaoHash(chave)];
        const indice = lista.findIndex(item => item.chave === chave);

        if (indice === -1) return false;

        lista.splice(indice, 1);
        return true;
    }
}


/* =====================================================
   2. HEAP BINÁRIO - FILA DE PRIORIDADE

   Ordem:
   1º Menor risco.
   2º Chegada mais antiga.
   3º Menor ID.

   Inserção e remoção prioritária: O(log n).
   Consulta do primeiro: O(1).
===================================================== */

class FilaPrioridade {
    constructor() {
        this.heap = [];
    }

    comparar(a, b) {
        if (a.risco !== b.risco) return a.risco < b.risco;

        const chegadaA = new Date(a.chegada).getTime();
        const chegadaB = new Date(b.chegada).getTime();

        if (chegadaA !== chegadaB) return chegadaA < chegadaB;

        return a.id < b.id;
    }

    inserir(paciente) {
        this.heap.push(paciente);
        this.subir(this.heap.length - 1);
    }

    subir(indice) {
        while (indice > 0) {
            const pai = Math.floor((indice - 1) / 2);

            if (!this.comparar(this.heap[indice], this.heap[pai])) break;

            [this.heap[indice], this.heap[pai]] =
                [this.heap[pai], this.heap[indice]];

            indice = pai;
        }
    }

    removerPrioritario() {
        if (this.heap.length === 0) return null;

        const primeiro = this.heap[0];
        const ultimo = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = ultimo;
            this.descer(0);
        }

        return primeiro;
    }

    // Remove um paciente específico sem reconstruir toda a fila.
    // A busca pelo ID custa O(n); o reajuste da Heap custa O(log n).
    removerPorId(id) {
        const indice = this.heap.findIndex(p => p.id === Number(id));

        if (indice === -1) return false;

        const ultimo = this.heap.pop();

        if (indice < this.heap.length) {
            this.heap[indice] = ultimo;
            const pai = Math.floor((indice - 1) / 2);

            if (indice > 0 && this.comparar(this.heap[indice], this.heap[pai])) {
                this.subir(indice);
            } else {
                this.descer(indice);
            }
        }

        return true;
    }

    descer(indice) {
        const tamanho = this.heap.length;

        while (true) {
            let menor = indice;
            const esquerda = 2 * indice + 1;
            const direita = 2 * indice + 2;

            if (esquerda < tamanho &&
                this.comparar(this.heap[esquerda], this.heap[menor])) {
                menor = esquerda;
            }

            if (direita < tamanho &&
                this.comparar(this.heap[direita], this.heap[menor])) {
                menor = direita;
            }

            if (menor === indice) break;

            [this.heap[indice], this.heap[menor]] =
                [this.heap[menor], this.heap[indice]];

            indice = menor;
        }
    }

    // Trabalha sobre uma cópia para não alterar a fila original.
    visualizarOrdenado() {
        const copia = new FilaPrioridade();
        copia.heap = [...this.heap];

        const resultado = [];

        while (copia.heap.length > 0) {
            resultado.push(copia.removerPrioritario());
        }

        return resultado;
    }

    get tamanho() {
        return this.heap.length;
    }
}


/* =====================================================
   3. DADOS E ESTRUTURAS DO SISTEMA
===================================================== */

const CHAVE_ARMAZENAMENTO = "sigae_web_dados_v1";

let pacientes = [];
let medicos = [];
let historico = [];

let tabelaPacientes = new TabelaHash();
let fila = new FilaPrioridade();

let proximoIdPaciente = 1;
let proximoIdMedico = 1;
let proximoIdHistorico = 1;


/* =====================================================
   4. ELEMENTOS DA INTERFACE
===================================================== */

const elemento = id => document.getElementById(id);

const formularioPaciente = elemento("formPaciente");
const formularioMedico = elemento("formMedico");

const campoNomePaciente = elemento("nomePaciente");
const campoRiscoPaciente = elemento("riscoPaciente");

const campoNomeMedico = elemento("nomeMedico");
const campoEspecialidadeMedico = elemento("especialidadeMedico");
const campoRegistroMedico = elemento("registroProfissionalMedico");
const campoStatusMedico = elemento("statusMedicoCadastro");


/* =====================================================
   5. FUNÇÕES AUXILIARES
===================================================== */

// Evita que textos cadastrados sejam interpretados como HTML.
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function nomeRisco(risco) {
    return ({
        1: "Emergência",
        2: "Muito urgente",
        3: "Urgente",
        4: "Pouco urgente",
        5: "Não urgente"
    })[risco] || "Não informado";
}

function nomeStatus(status) {
    return ({
        aguardando: "Aguardando",
        chamado: "Chamado",
        atendimento: "Em atendimento",
        concluido: "Concluído",
        cancelado: "Cancelado"
    })[status] || status;
}

function classeStatus(status) {
    return ({
        aguardando: "status-aguardando",
        chamado: "status-chamado",
        atendimento: "status-atendimento",
        concluido: "status-concluido",
        cancelado: "status-cancelado"
    })[status] || "";
}

function formatarData(data) {
    if (!data) return "-";

    return new Date(data).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function mostrarNotificacao(mensagem) {
    const notificacao = elemento("notificacao");

    if (!notificacao) {
        alert(mensagem);
        return;
    }

    notificacao.textContent = mensagem;
    notificacao.classList.add("visivel");

    clearTimeout(mostrarNotificacao.timer);

    mostrarNotificacao.timer = setTimeout(() => {
        notificacao.classList.remove("visivel");
    }, 3000);
}

function confirmar(mensagem) {
    return window.confirm(mensagem);
}

function atualizarCampo(id, valor) {
    const campo = elemento(id);
    if (campo) campo.textContent = valor;
}

function medicoEstaDisponivel(medico) {
    return medico.disponivel === true &&
        medico.pacienteAtualId === null;
}


/* =====================================================
   6. ARMAZENAMENTO LOCAL
===================================================== */

function salvarDados() {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({
        pacientes,
        medicos,
        historico,
        proximoIdPaciente,
        proximoIdMedico,
        proximoIdHistorico
    }));
}

function carregarDados() {
    const dadosSalvos = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!dadosSalvos) return;

    try {
        const dados = JSON.parse(dadosSalvos);

        pacientes = dados.pacientes || [];
        medicos = dados.medicos || [];
        historico = dados.historico || [];

        proximoIdPaciente = dados.proximoIdPaciente || 1;
        proximoIdMedico = dados.proximoIdMedico || 1;
        proximoIdHistorico = dados.proximoIdHistorico || 1;

        // Completa campos adicionados em versões anteriores.
        medicos.forEach(medico => {
            medico.registroProfissional ??=
                `REG-${String(medico.id).padStart(4, "0")}`;

            medico.ultimaAtribuicao ??= null;
            medico.consultasConcluidas ??= 0;
            medico.pacienteAtualId ??= null;
            medico.disponivel ??= true;
        });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        mostrarNotificacao("Não foi possível carregar os dados salvos.");
    }
}


/* =====================================================
   7. RECONSTRUÇÃO INICIAL DAS ESTRUTURAS

   Executada no carregamento do sistema.
   Depois disso, as estruturas são atualizadas conforme
   cada operação, evitando reconstruções desnecessárias.
===================================================== */

function reconstruirEstruturas() {
    tabelaPacientes = new TabelaHash();
    fila = new FilaPrioridade();

    pacientes.forEach(paciente => {
        tabelaPacientes.inserir(paciente.id, paciente);

        if (paciente.status === "aguardando") {
            fila.inserir(paciente);
        }
    });
}


/* =====================================================
   8. HISTÓRICO
===================================================== */

function registrarHistorico(tipo, descricao, pacienteId = null, medicoId = null) {
    historico.unshift({
        id: proximoIdHistorico++,
        tipo,
        descricao,
        pacienteId,
        medicoId,
        data: new Date().toISOString()
    });
}


/* =====================================================
   9. CADASTRO DE PACIENTES
===================================================== */

function cadastrarPaciente(evento) {
    evento.preventDefault();

    const nome = campoNomePaciente?.value.trim();
    const risco = Number(campoRiscoPaciente?.value);

    if (!nome || !Number.isInteger(risco) || risco < 1 || risco > 5) {
        mostrarNotificacao("Preencha corretamente os dados do paciente.");
        return;
    }

    const paciente = {
        id: proximoIdPaciente++,
        nome,
        risco,
        chegada: new Date().toISOString(),
        status: "aguardando",
        medicoId: null,
        inicioAtendimento: null,
        fimAtendimento: null
    };

    pacientes.push(paciente);

    // Atualização direta das estruturas: O(1) esperado na Hash
    // e O(log n) na inserção da Heap.
    tabelaPacientes.inserir(paciente.id, paciente);
    fila.inserir(paciente);

    registrarHistorico(
        "Cadastro",
        `Paciente ${paciente.nome} cadastrado com risco ${paciente.risco}.`,
        paciente.id
    );

    formularioPaciente.reset();
    atualizarInterface();

    mostrarNotificacao(`Paciente ${paciente.nome} cadastrado com sucesso.`);
}


/* =====================================================
   10. CONSULTA DE PACIENTE PELA TABELA HASH
===================================================== */

function consultarPacientePorId(id) {
    const paciente = tabelaPacientes.buscar(Number(id));
    const resultado = elemento("resultadoConsultaPaciente");

    if (!paciente) {
        if (resultado) {
            resultado.innerHTML = '<p class="vazio">Paciente não encontrado.</p>';
        }

        mostrarNotificacao("Não existe paciente com esse código.");
        return null;
    }

    if (resultado) {
        resultado.innerHTML = `
            <div class="resultado-consulta">
                <strong>${escaparHTML(paciente.nome)}</strong>
                <p>Código: #${paciente.id}</p>
                <p>Risco: ${paciente.risco} - ${nomeRisco(paciente.risco)}</p>
                <p>Chegada: ${formatarData(paciente.chegada)}</p>
                <p>Situação: ${nomeStatus(paciente.status)}</p>
            </div>
        `;
    }

    return paciente;
}


/* =====================================================
   11. RECLASSIFICAÇÃO DE PACIENTE

   O paciente é removido da Heap e inserido novamente
   com o novo risco. Isso mantém a ordem correta e evita
   duplicidade na fila.
===================================================== */

function reclassificarPaciente(id, novoRisco) {
    const paciente = tabelaPacientes.buscar(Number(id));
    novoRisco = Number(novoRisco);

    if (!paciente) {
        mostrarNotificacao("Paciente não encontrado.");
        return false;
    }

    if (paciente.status !== "aguardando") {
        mostrarNotificacao("Somente pacientes aguardando podem ser reclassificados.");
        return false;
    }

    if (!Number.isInteger(novoRisco) || novoRisco < 1 || novoRisco > 5) {
        mostrarNotificacao("Classificação de risco inválida.");
        return false;
    }

    const riscoAnterior = paciente.risco;

    fila.removerPorId(paciente.id);
    paciente.risco = novoRisco;
    fila.inserir(paciente);

    registrarHistorico(
        "Reclassificação",
        `Risco de ${paciente.nome} alterado de ${riscoAnterior} para ${novoRisco}.`,
        paciente.id
    );

    atualizarInterface();
    mostrarNotificacao("Classificação atualizada com sucesso.");

    return true;
}

function enviarReclassificacao(evento) {
    evento.preventDefault();

    const id = elemento("idPacienteReclassificar")?.value;
    const risco = elemento("novoRiscoPaciente")?.value;

    if (reclassificarPaciente(id, risco)) {
        evento.target.reset();
    }
}


/* =====================================================
   12. CADASTRO DE MÉDICOS
===================================================== */

function cadastrarMedico(evento) {
    evento.preventDefault();

    const nome = campoNomeMedico?.value.trim();
    const especialidade = campoEspecialidadeMedico?.value.trim();
    const registroProfissional = campoRegistroMedico?.value.trim();
    const status = campoStatusMedico?.value || "disponivel";

    if (!nome || !especialidade || !registroProfissional) {
        mostrarNotificacao("Preencha todos os dados do médico.");
        return;
    }

    const medico = {
        id: proximoIdMedico++,
        nome,
        especialidade,
        registroProfissional,
        disponivel: status === "disponivel",
        pacienteAtualId: null,
        consultasConcluidas: 0,
        ultimaAtribuicao: null
    };

    medicos.push(medico);

    registrarHistorico(
        "Cadastro de médico",
        `Médico ${medico.nome} cadastrado com registro ${medico.registroProfissional}.`,
        null,
        medico.id
    );

    formularioMedico.reset();
    atualizarInterface();

    mostrarNotificacao(`Médico ${medico.nome} cadastrado com sucesso.`);
}


/* =====================================================
   13. SELEÇÃO DO MÉDICO

   Critérios:
   1º Menor quantidade de consultas concluídas.
   2º Maior tempo sem receber paciente.
   3º Menor ID.

   A seleção percorre a lista uma vez: O(m).
===================================================== */

function selecionarMedicoDisponivel() {
    let escolhido = null;

    for (const medico of medicos) {
        if (!medicoEstaDisponivel(medico)) continue;

        if (!escolhido ||
            medico.consultasConcluidas < escolhido.consultasConcluidas) {
            escolhido = medico;
            continue;
        }

        if (medico.consultasConcluidas === escolhido.consultasConcluidas) {
            const ultimaMedico = medico.ultimaAtribuicao
                ? new Date(medico.ultimaAtribuicao).getTime()
                : 0;

            const ultimaEscolhido = escolhido.ultimaAtribuicao
                ? new Date(escolhido.ultimaAtribuicao).getTime()
                : 0;

            if (ultimaMedico < ultimaEscolhido ||
                (ultimaMedico === ultimaEscolhido && medico.id < escolhido.id)) {
                escolhido = medico;
            }
        }
    }

    return escolhido;
}


/* =====================================================
   14. CHAMAR PRÓXIMO PACIENTE
===================================================== */

function chamarProximoPaciente() {
    if (fila.tamanho === 0) {
        mostrarNotificacao("Não há pacientes aguardando.");
        return;
    }

    const medico = selecionarMedicoDisponivel();

    if (!medico) {
        mostrarNotificacao("Não há médicos disponíveis. O paciente permanece na fila.");
        return;
    }

    const paciente = fila.removerPrioritario();

    if (!paciente || paciente.status !== "aguardando") {
        reconstruirEstruturas();
        atualizarInterface();
        mostrarNotificacao("Não foi possível realizar a chamada.");
        return;
    }

    paciente.status = "chamado";
    paciente.medicoId = medico.id;

    medico.disponivel = false;
    medico.pacienteAtualId = paciente.id;
    medico.ultimaAtribuicao = new Date().toISOString();

    registrarHistorico(
        "Chamada",
        `Paciente ${paciente.nome} chamado pelo médico ${medico.nome}.`,
        paciente.id,
        medico.id
    );

    atualizarInterface();

    mostrarNotificacao(
        `${paciente.nome} chamado para atendimento com ${medico.nome}.`
    );
}


/* =====================================================
   15. INICIAR ATENDIMENTO
===================================================== */

function iniciarAtendimento(idPaciente) {
    const paciente = tabelaPacientes.buscar(Number(idPaciente));

    if (!paciente || paciente.status !== "chamado") {
        mostrarNotificacao("Não foi possível iniciar este atendimento.");
        return;
    }

    paciente.status = "atendimento";
    paciente.inicioAtendimento = new Date().toISOString();

    const medico = medicos.find(m => m.id === paciente.medicoId);

    registrarHistorico(
        "Início de atendimento",
        `Atendimento de ${paciente.nome} iniciado.`,
        paciente.id,
        medico?.id ?? null
    );

    atualizarInterface();
    mostrarNotificacao(`Atendimento de ${paciente.nome} iniciado.`);
}


/* =====================================================
   16. CONCLUIR ATENDIMENTO

   A contagem do médico só aumenta quando a consulta
   realmente é concluída.
===================================================== */

function concluirAtendimento(idPaciente) {
    const paciente = tabelaPacientes.buscar(Number(idPaciente));

    if (!paciente || paciente.status !== "atendimento") {
        mostrarNotificacao("Este paciente não está em atendimento.");
        return;
    }

    if (!confirmar(`Deseja concluir o atendimento de ${paciente.nome}?`)) {
        return;
    }

    const medico = medicos.find(m => m.id === paciente.medicoId);

    paciente.status = "concluido";
    paciente.fimAtendimento = new Date().toISOString();

    if (medico) {
        medico.disponivel = true;
        medico.pacienteAtualId = null;
        medico.consultasConcluidas++;
    }

    registrarHistorico(
        "Atendimento concluído",
        `Atendimento de ${paciente.nome} concluído.`,
        paciente.id,
        medico?.id ?? null
    );

    atualizarInterface();
    mostrarNotificacao(`Atendimento de ${paciente.nome} concluído.`);
}


/* =====================================================
   17. DESFAZER CHAMADA
   Permitido somente antes do início do atendimento.
===================================================== */

function desfazerChamada(idPaciente) {
    const paciente = tabelaPacientes.buscar(Number(idPaciente));

    if (!paciente || paciente.status !== "chamado") {
        mostrarNotificacao("Somente chamadas ainda não iniciadas podem ser desfeitas.");
        return;
    }

    if (!confirmar(`Deseja desfazer a chamada de ${paciente.nome}?`)) return;

    const medico = medicos.find(m => m.id === paciente.medicoId);

    if (medico) {
        medico.disponivel = true;
        medico.pacienteAtualId = null;
    }

    paciente.status = "aguardando";
    paciente.medicoId = null;
    paciente.inicioAtendimento = null;

    // O paciente volta à Heap respeitando sua prioridade original.
    fila.inserir(paciente);

    registrarHistorico(
        "Chamada desfeita",
        `Chamada de ${paciente.nome} desfeita. Paciente retornou à fila.`,
        paciente.id,
        medico?.id ?? null
    );

    atualizarInterface();
    mostrarNotificacao("Paciente retornou à fila de prioridade.");
}


/* =====================================================
   18. CANCELAR PACIENTE
===================================================== */

function cancelarPaciente(idPaciente) {
    const paciente = tabelaPacientes.buscar(Number(idPaciente));

    if (!paciente ||
        !["aguardando", "chamado", "atendimento"].includes(paciente.status)) {
        mostrarNotificacao("Este paciente não pode ser cancelado.");
        return;
    }

    if (!confirmar(`Deseja realmente cancelar o atendimento de ${paciente.nome}?`)) {
        return;
    }

    const medico = medicos.find(m => m.id === paciente.medicoId);

    // Se ainda aguardava, precisa sair da Heap.
    if (paciente.status === "aguardando") {
        fila.removerPorId(paciente.id);
    }

    if (medico) {
        medico.disponivel = true;
        medico.pacienteAtualId = null;
    }

    paciente.status = "cancelado";
    paciente.medicoId = null;

    registrarHistorico(
        "Cancelamento",
        `Atendimento de ${paciente.nome} cancelado.`,
        paciente.id,
        medico?.id ?? null
    );

    atualizarInterface();
    mostrarNotificacao("Atendimento cancelado.");
}


/* =====================================================
   19. DISPONIBILIDADE DO MÉDICO
===================================================== */

function alterarDisponibilidade(idMedico) {
    const medico = medicos.find(m => m.id === Number(idMedico));

    if (!medico) return;

    if (medico.pacienteAtualId !== null) {
        mostrarNotificacao("O médico está atendendo. Finalize ou cancele primeiro.");
        return;
    }

    medico.disponivel = !medico.disponivel;

    registrarHistorico(
        "Disponibilidade",
        `Médico ${medico.nome}: ${medico.disponivel ? "disponível" : "indisponível"}.`,
        null,
        medico.id
    );

    atualizarInterface();

    mostrarNotificacao(
        `Médico ${medico.nome}: ${medico.disponivel ? "disponível" : "indisponível"}.`
    );
}


/* =====================================================
   20. PAINEL PRINCIPAL
===================================================== */

function atualizarPainel() {
    const aguardando = pacientes.filter(p => p.status === "aguardando").length;
    const atendimento = pacientes.filter(
        p => ["atendimento", "chamado"].includes(p.status)
    ).length;
    const concluidos = pacientes.filter(p => p.status === "concluido").length;
    const disponiveis = medicos.filter(medicoEstaDisponivel).length;
    const ocupados = medicos.filter(m => m.pacienteAtualId !== null).length;

    atualizarCampo("totalAguardando", aguardando);
    atualizarCampo("totalAtendimento", atendimento);
    atualizarCampo("totalConcluidos", concluidos);
    atualizarCampo("totalMedicosDisponiveis", disponiveis);
    atualizarCampo("totalMedicosOcupados", ocupados);
}


/* =====================================================
   21. PACIENTES REGISTRADOS E PESQUISA
===================================================== */

function exibirPacientes() {
    const area = elemento("listaPacientes");
    if (!area) return;

    const busca = elemento("buscaPaciente")?.value.trim().toLowerCase() || "";

    const encontrados = pacientes.filter(p =>
        p.nome.toLowerCase().includes(busca) ||
        String(p.id).includes(busca)
    );

    if (encontrados.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum paciente encontrado.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Código</th><th>Paciente</th><th>Risco</th><th>Chegada</th><th>Situação</th><th>Ações</th></tr>
            </thead>
            <tbody>
                ${encontrados.map(p => `
                    <tr>
                        <td><strong>#${p.id}</strong></td>
                        <td>${escaparHTML(p.nome)}</td>
                        <td><span class="etiqueta risco-${p.risco}">${p.risco} - ${nomeRisco(p.risco)}</span></td>
                        <td>${formatarData(p.chegada)}</td>
                        <td><span class="etiqueta ${classeStatus(p.status)}">${nomeStatus(p.status)}</span></td>
                        <td class="acoes">
                            ${["aguardando", "chamado", "atendimento"].includes(p.status)
                                ? `<button class="botao-acao perigo" data-action="cancelar" data-id="${p.id}">Cancelar</button>`
                                : "-"}
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   22. PACIENTES POR ORDEM DE CHEGADA
===================================================== */

function exibirPacientesPorChegada() {
    const area = elemento("listaPacientesChegada");
    if (!area) return;

    const ordenados = [...pacientes].sort(
        (a, b) => new Date(a.chegada) - new Date(b.chegada)
    );

    if (ordenados.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum paciente cadastrado.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Ordem</th><th>Código</th><th>Paciente</th><th>Chegada</th><th>Situação</th></tr>
            </thead>
            <tbody>
                ${ordenados.map((p, i) => `
                    <tr>
                        <td>${i + 1}º</td>
                        <td>#${p.id}</td>
                        <td>${escaparHTML(p.nome)}</td>
                        <td>${formatarData(p.chegada)}</td>
                        <td>${nomeStatus(p.status)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   23. MÉDICOS CADASTRADOS
===================================================== */

function exibirMedicos() {
    const area = elemento("listaMedicos");
    if (!area) return;

    if (medicos.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum médico cadastrado.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Código</th><th>Médico</th><th>Especialidade</th><th>Registro</th><th>Consultas concluídas</th><th>Disponibilidade</th><th>Ação</th></tr>
            </thead>
            <tbody>
                ${medicos.map(m => {
                    const ocupado = m.pacienteAtualId !== null;
                    const status = ocupado ? "Em atendimento" : m.disponivel ? "Disponível" : "Indisponível";

                    return `
                        <tr>
                            <td><strong>#${m.id}</strong></td>
                            <td>${escaparHTML(m.nome)}</td>
                            <td>${escaparHTML(m.especialidade)}</td>
                            <td>${escaparHTML(m.registroProfissional)}</td>
                            <td>${m.consultasConcluidas}</td>
                            <td>
                                <span class="etiqueta ${m.disponivel && !ocupado ? "status-disponivel" : "status-indisponivel"}">
                                    ${status}
                                </span>
                            </td>
                            <td class="acoes">
                                ${ocupado ? "-" : `
                                    <button class="botao-acao" data-action="disponibilidade" data-id="${m.id}">
                                        ${m.disponivel ? "Indisponibilizar" : "Disponibilizar"}
                                    </button>
                                `}
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   24. FILA DE PRIORIDADE
===================================================== */

function exibirFila() {
    const area = elemento("listaFila");
    if (!area) return;

    const aguardando = fila.visualizarOrdenado();
    atualizarCampo("contadorFila", `${aguardando.length} paciente(s)`);

    if (aguardando.length === 0) {
        area.innerHTML = '<p class="vazio">Não há pacientes aguardando.</p>';
    } else {
        area.innerHTML = `
            <table>
                <thead>
                    <tr><th>Posição</th><th>Paciente</th><th>Risco</th><th>Horário de chegada</th><th>Código</th></tr>
                </thead>
                <tbody>
                    ${aguardando.map((p, i) => `
                        <tr>
                            <td><strong>${i + 1}º</strong></td>
                            <td>${escaparHTML(p.nome)}</td>
                            <td><span class="etiqueta risco-${p.risco}">${p.risco} - ${nomeRisco(p.risco)}</span></td>
                            <td>${formatarData(p.chegada)}</td>
                            <td>#${p.id}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    exibirChamadosEAtendimentos();
}


/* =====================================================
   25. CHAMADOS E ATENDIMENTOS EM ANDAMENTO
===================================================== */

function exibirChamadosEAtendimentos() {
    const area = elemento("listaEmAtendimento");
    if (!area) return;

    const ativos = pacientes.filter(
        p => p.status === "chamado" || p.status === "atendimento"
    );

    if (ativos.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum atendimento em andamento.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Paciente</th><th>Médico</th><th>Situação</th><th>Ações</th></tr>
            </thead>
            <tbody>
                ${ativos.map(p => {
                    const medico = medicos.find(m => m.id === p.medicoId);

                    return `
                        <tr>
                            <td><strong>${escaparHTML(p.nome)}</strong><br><small>Código #${p.id}</small></td>
                            <td>${medico ? escaparHTML(medico.nome) : "-"}</td>
                            <td><span class="etiqueta ${classeStatus(p.status)}">${nomeStatus(p.status)}</span></td>
                            <td class="acoes">
                                ${p.status === "chamado" ? `
                                    <button class="botao-acao sucesso" data-action="iniciar" data-id="${p.id}">Iniciar</button>
                                    <button class="botao-acao" data-action="desfazer" data-id="${p.id}">Desfazer</button>
                                ` : `
                                    <button class="botao-acao sucesso" data-action="concluir" data-id="${p.id}">Concluir</button>
                                `}
                                <button class="botao-acao perigo" data-action="cancelar" data-id="${p.id}">Cancelar</button>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   26. RESUMOS DO PAINEL
===================================================== */

function exibirResumoFila() {
    const area = elemento("resumoFila");
    if (!area) return;

    const lista = fila.visualizarOrdenado().slice(0, 5);

    area.innerHTML = lista.length ? lista.map(p => `
        <div class="item-simples">
            <div>
                <strong>${escaparHTML(p.nome)}</strong>
                <small>Risco ${p.risco} · ${nomeRisco(p.risco)}</small>
            </div>
            <span class="etiqueta risco-${p.risco}">${p.risco}</span>
        </div>
    `).join("") : '<p class="vazio">Nenhum paciente aguardando.</p>';
}

function exibirResumoMedicos() {
    const area = elemento("resumoMedicos");
    if (!area) return;

    area.innerHTML = medicos.length ? medicos.slice(0, 5).map(m => {
        const ocupado = m.pacienteAtualId !== null;
        const status = ocupado ? "Em atendimento" : m.disponivel ? "Disponível" : "Indisponível";

        return `
            <div class="item-simples">
                <div>
                    <strong>${escaparHTML(m.nome)}</strong>
                    <small>${escaparHTML(m.especialidade)}</small>
                </div>
                <span class="etiqueta ${m.disponivel && !ocupado ? "status-disponivel" : "status-indisponivel"}">${status}</span>
            </div>
        `;
    }).join("") : '<p class="vazio">Nenhum médico cadastrado.</p>';
}

function exibirResumoHistorico() {
    const area = elemento("resumoHistorico");
    if (!area) return;

    area.innerHTML = historico.length ? historico.slice(0, 5).map(item => `
        <div class="item-simples">
            <div>
                <strong>${escaparHTML(item.tipo)}</strong>
                <small>${escaparHTML(item.descricao)}</small>
            </div>
            <small>${formatarData(item.data)}</small>
        </div>
    `).join("") : '<p class="vazio">Nenhuma movimentação registrada.</p>';
}


/* =====================================================
   27. CONSULTAS CONCLUÍDAS
===================================================== */

function exibirConsultasConcluidas() {
    const area = elemento("listaConcluidos");
    if (!area) return;

    const concluidos = pacientes
        .filter(p => p.status === "concluido")
        .sort((a, b) => new Date(b.fimAtendimento) - new Date(a.fimAtendimento));

    if (concluidos.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum atendimento concluído.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Paciente</th><th>Médico</th><th>Início</th><th>Conclusão</th></tr>
            </thead>
            <tbody>
                ${concluidos.map(p => {
                    const medico = medicos.find(m => m.id === p.medicoId);

                    return `
                        <tr>
                            <td>${escaparHTML(p.nome)}</td>
                            <td>${medico ? escaparHTML(medico.nome) : "-"}</td>
                            <td>${formatarData(p.inicioAtendimento)}</td>
                            <td>${formatarData(p.fimAtendimento)}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   28. CONSULTAS CONCLUÍDAS POR MÉDICO
===================================================== */

function exibirResumoConsultasMedicos() {
    const area = elemento("resumoConsultasMedicos");
    if (!area) return;

    if (medicos.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum médico cadastrado.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Médico</th><th>Especialidade</th><th>Consultas concluídas</th></tr>
            </thead>
            <tbody>
                ${medicos.map(m => `
                    <tr>
                        <td>${escaparHTML(m.nome)}</td>
                        <td>${escaparHTML(m.especialidade)}</td>
                        <td><strong>${m.consultasConcluidas}</strong></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   29. PESQUISA NO HISTÓRICO
===================================================== */

function exibirHistorico() {
    const area = elemento("listaHistorico");
    if (!area) return;

    const busca = elemento("buscaHistorico")?.value.trim().toLowerCase() || "";

    const encontrados = historico.filter(item => {
        const paciente = item.pacienteId
            ? tabelaPacientes.buscar(item.pacienteId)
            : null;

        const medico = item.medicoId
            ? medicos.find(m => m.id === item.medicoId)
            : null;

        const texto = [
            item.id, item.tipo, item.descricao, item.pacienteId,
            paciente?.nome || "", medico?.nome || ""
        ].join(" ").toLowerCase();

        return texto.includes(busca);
    });

    if (encontrados.length === 0) {
        area.innerHTML = '<p class="vazio">Nenhum registro encontrado.</p>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr><th>Registro</th><th>Movimentação</th><th>Descrição</th><th>Paciente</th><th>Médico</th><th>Data e horário</th></tr>
            </thead>
            <tbody>
                ${encontrados.map(item => {
                    const paciente = item.pacienteId
                        ? tabelaPacientes.buscar(item.pacienteId)
                        : null;

                    const medico = item.medicoId
                        ? medicos.find(m => m.id === item.medicoId)
                        : null;

                    return `
                        <tr>
                            <td>#${item.id}</td>
                            <td><strong>${escaparHTML(item.tipo)}</strong></td>
                            <td>${escaparHTML(item.descricao)}</td>
                            <td>${paciente ? escaparHTML(paciente.nome) : "-"}</td>
                            <td>${medico ? escaparHTML(medico.nome) : "-"}</td>
                            <td>${formatarData(item.data)}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}


/* =====================================================
   30. NAVEGAÇÃO ENTRE TELAS
===================================================== */

function abrirTela(nomeTela) {
    document.querySelectorAll(".tela").forEach(tela => {
        tela.classList.toggle("ativa", tela.id === `view-${nomeTela}`);
    });

    document.querySelectorAll(".menu-item").forEach(botao => {
        botao.classList.toggle("ativo", botao.dataset.view === nomeTela);
    });
}


/* =====================================================
   31. ATUALIZAÇÃO DA INTERFACE
   Não reconstrói a Hash nem a Heap.
   As estruturas são atualizadas nas próprias operações.
===================================================== */

function atualizarInterface() {
    atualizarPainel();

    exibirPacientes();
    exibirPacientesPorChegada();
    exibirMedicos();
    exibirFila();
    exibirHistorico();

    exibirResumoFila();
    exibirResumoMedicos();
    exibirResumoHistorico();

    exibirConsultasConcluidas();
    exibirResumoConsultasMedicos();

    salvarDados();
}


/* =====================================================
   32. EVENTOS DOS FORMULÁRIOS
===================================================== */

formularioPaciente?.addEventListener("submit", cadastrarPaciente);
formularioMedico?.addEventListener("submit", cadastrarMedico);

elemento("formReclassificarPaciente")?.addEventListener(
    "submit", enviarReclassificacao
);

elemento("formConsultaPaciente")?.addEventListener("submit", evento => {
    evento.preventDefault();
    consultarPacientePorId(elemento("consultaPacienteId")?.value);
});


/* =====================================================
   33. EVENTOS DOS BOTÕES E PESQUISAS
===================================================== */

elemento("btnChamarProximo")?.addEventListener("click", chamarProximoPaciente);
elemento("buscaPaciente")?.addEventListener("input", exibirPacientes);
elemento("buscaHistorico")?.addEventListener("input", exibirHistorico);


/* =====================================================
   34. NAVEGAÇÃO E AÇÕES DAS TABELAS
===================================================== */

document.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-view], [data-go], [data-action]");
    if (!botao) return;

    if (botao.dataset.view) {
        abrirTela(botao.dataset.view);
        return;
    }

    if (botao.dataset.go) {
        abrirTela(botao.dataset.go);
        return;
    }

    const id = Number(botao.dataset.id);

    const acoes = {
        iniciar: iniciarAtendimento,
        concluir: concluirAtendimento,
        desfazer: desfazerChamada,
        cancelar: cancelarPaciente,
        disponibilidade: alterarDisponibilidade
    };

    acoes[botao.dataset.action]?.(id);
});


/* =====================================================
   35. DATA E INICIALIZAÇÃO
===================================================== */

atualizarCampo("dataAtual", new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
}));

carregarDados();
reconstruirEstruturas();
atualizarInterface();

console.log("SIGAE WEB iniciado com sucesso.");
console.log("Tabela Hash e Heap Binário carregadas.");
console.log("Dados locais carregados.");
