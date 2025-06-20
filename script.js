const totalArmariosMasculinos = 100;
const totalArmariosFemininos = 119;
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
  const nome = document.getElementById("colaboradorNome").value;
  const matricula = document.getElementById("colaboradorMatricula").value;
  const { tipo, numero } = armarioAtual;
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


// Inicializa tudo ao carregar
window.onload = () => {
  const dadosSalvos = localStorage.getItem("armarios");
  if (dadosSalvos) {
    try {
      armarios = JSON.parse(dadosSalvos);
    } catch {
      console.warn("Dados corrompidos no localStorage. Inicializando do zero.");
      criarArmarios();
    }
    renderizarArmarios();
  } else {
    criarArmarios();
  }
};

function salvarNoLocalStorage() {
  localStorage.setItem("armarios", JSON.stringify(armarios));
}