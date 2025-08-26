let totalArmariosMasculinos = 100;
let totalArmariosFemininos = 119;
let armarios = { masculinos: [], femininos: [] };
let armarioAtual = null;

function criarArmarios() {
  for (let i = 1; i <= totalArmariosMasculinos; i++) {
    armarios.masculinos.push({ numero: i, colaborador: "", chapa: "" });
  }
  for (let i = 1; i <= totalArmariosFemininos; i++) {
    armarios.femininos.push({ numero: i, colaborador: "", chapa: "" });
  }
  renderizarArmarios();
}

function renderizarArmarios() {
  ["masculinos", "femininos"].forEach(tipo => {
    const container = document.getElementById(tipo);
    container.innerHTML = "";
    armarios[tipo].forEach(armario => {
      const btn = document.createElement("button");
      btn.className = `btn armario-btn ${armario.colaborador ? "ocupado" : "vazio"}`;
      btn.innerText = armario.numero;
      btn.title = armario.colaborador || "Disponível";
      btn.onclick = () => abrirModal(tipo, armario.numero);
      container.appendChild(btn);
    });
  });
}
//model
function abrirModal(tipo, numero) {
  armarioAtual = { tipo, numero };
  const armario = armarios[tipo].find(a => a.numero === numero);
  document.getElementById("colaboradorNome").value = armario.colaborador;
  document.getElementById("armarioSelecionado").innerText = `#${numero}`;
  document.getElementById("colaboradorMatricula").value = armario.chapa;
  const modal = new bootstrap.Modal(document.getElementById("editarModal"));
  modal.show();
}

function salvarEdicao() {
  const nome = document.getElementById("colaboradorNome").value.trim();
  const matricula = document.getElementById("colaboradorMatricula").value.trim();
  const { tipo, numero } = armarioAtual;

  // Verifica se a matrícula já existe em outro armário
  if (matricula) {
    let armarioExistente = null;

    Object.keys(armarios).forEach(sexo => {
      armarios[sexo].forEach(arm => {
        if (arm.chapa === matricula && !(sexo === tipo && arm.numero === numero)) {
          armarioExistente = { sexo, numero: arm.numero };
        }
      });
    });

    if (armarioExistente) {
      const nomeSexo = armarioExistente.sexo === "masculinos" ? "Masculino" : "Feminino";
      alert(`Essa matrícula já está vinculada ao armário ${nomeSexo} #${armarioExistente.numero}.`);
      return;
    }
  }

  const armario = armarios[tipo].find(a => a.numero === numero);
  armario.colaborador = nome;
  armario.chapa = matricula;

  salvarNoLocalStorage();
  renderizarArmarios();
  bootstrap.Modal.getInstance(document.getElementById("editarModal")).hide();
}


function removerArmario() {
  const { tipo, numero } = armarioAtual;
  const armario = armarios[tipo].find(a => a.numero === numero);
  armario.colaborador = "";
  armario.chapa = "";
  salvarNoLocalStorage();
  renderizarArmarios();
  bootstrap.Modal.getInstance(document.getElementById("editarModal")).hide();
}

function exportarPlanilha() {
  const dados = [];

  ["masculinos", "femininos"].forEach(sexo => {
    armarios[sexo].forEach(armario => {
      dados.push({
        Sexo: sexo === "masculinos" ? "Masculino" : "Feminino",
        Número: armario.numero,
        Colaborador: armario.colaborador,
        Matrícula: armario.chapa
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Armários");

  XLSX.writeFile(workbook, "armarios.xlsx");
}

function importarPlanilha(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const extension = file.name.split('.').pop().toLowerCase();

  reader.onload = e => {
    try {
      if (extension === "json") {
        armarios = JSON.parse(e.target.result);
      } else if (extension === "xlsx" || extension === "xls") {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const planilha = workbook.Sheets[workbook.SheetNames[0]];
        const dados = XLSX.utils.sheet_to_json(planilha);

        // Resetar estrutura
        armarios = { masculinos: [], femininos: [] };

        dados.forEach(row => {
          const tipo = row["Sexo"] === "Masculino" ? "masculinos" : "femininos";
          armarios[tipo].push({
            numero: parseInt(row["Número"]),
            colaborador: row["Colaborador"] || "",
            chapa: row["Matrícula"] || ""
          });
        });
      } else {
        return alert("Formato de arquivo não suportado.");
      }

      renderizarArmarios();
    } catch (err) {
      alert("Erro ao importar a planilha.");
      console.error(err);
    }
  };

  if (extension === "json") {
    reader.readAsText(file);
  } else {
    reader.readAsBinaryString(file);
  }
}
function salvarConfiguracao() {
  const qtdM = parseInt(document.getElementById("qtdMasculinos").value);
  const qtdF = parseInt(document.getElementById("qtdFemininos").value);

  if (!isNaN(qtdM) && qtdM >= 0) totalArmariosMasculinos = qtdM;
  if (!isNaN(qtdF) && qtdF >= 0) totalArmariosFemininos = qtdF;

  // Recria os armários mantendo os dados existentes quando possível
  const novosArmarios = { masculinos: [], femininos: [] };

  for (let i = 1; i <= totalArmariosMasculinos; i++) {
    const existente = armarios.masculinos.find(a => a.numero === i);
    novosArmarios.masculinos.push(existente || { numero: i, colaborador: "", chapa: "" });
  }

  for (let i = 1; i <= totalArmariosFemininos; i++) {
    const existente = armarios.femininos.find(a => a.numero === i);
    novosArmarios.femininos.push(existente || { numero: i, colaborador: "", chapa: "" });
  }

  armarios = novosArmarios;
  salvarNoLocalStorage();
  renderizarArmarios();

  bootstrap.Modal.getInstance(document.getElementById("configModal")).hide();
}



// Inicializa tudo ao carregar
window.onload = () => {
  const dadosSalvos = localStorage.getItem("armarios");
  if (dadosSalvos) {
    try {
      armarios = JSON.parse(dadosSalvos);
      totalArmariosMasculinos = armarios.masculinos.length;
      totalArmariosFemininos = armarios.femininos.length;
    } catch {
      console.warn("Dados corrompidos no localStorage. Inicializando do zero.");
      criarArmarios();
    }
    renderizarArmarios();
  } else {
    criarArmarios();
  }

  // Preenche os inputs do modal
  document.getElementById("qtdMasculinos").value = totalArmariosMasculinos;
  document.getElementById("qtdFemininos").value = totalArmariosFemininos;
};


function salvarNoLocalStorage() {
  localStorage.setItem("armarios", JSON.stringify(armarios));
}

// ADCionando função limpar tudo
function limparTudo() {
  const confirmar = confirm(
    "Tem certeza que deseja LIMPAR TODOS os dados (nomes e matrículas) de TODOS os armários? Esta ação não pode ser desfeita."
  );
  if (!confirmar) return;

  // Zera colaborador e matrícula em todos os armários, preservando a quantidade atual
  ["masculinos", "femininos"].forEach(sexo => {
    armarios[sexo] = armarios[sexo].map(a => ({
      ...a,
      colaborador: "",
      chapa: ""
    }));
  });

  // Persiste vazio e re-renderiza
  salvarNoLocalStorage();
  renderizarArmarios();

  // Se o modal de edição estiver aberto, fecha
  const modalEl = document.getElementById("editarModal");
  const instancia = bootstrap.Modal.getInstance(modalEl);
  if (instancia) instancia.hide();

  alert("Pronto! Todos os armários foram esvaziados.");
}