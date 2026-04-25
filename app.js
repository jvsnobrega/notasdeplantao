let notas = JSON.parse(localStorage.getItem("notas") || "[]");
let editId = null;
let activeTag = null;

const listEl = document.getElementById("list");
const modal = document.getElementById("modal");

const paciente = document.getElementById("paciente");
const leito = document.getElementById("leito");
const notaField = document.getElementById("nota");
const searchInput = document.getElementById("search");

function save() {
  localStorage.setItem("notas", JSON.stringify(notas));
}

function extractTags(text) {
  return text.match(/#\w+/g) || [];
}

function applyTagFilter(tag) {
  activeTag = tag;
  searchInput.value = tag;
  render();
}

function clearFilter() {
  activeTag = null;
  searchInput.value = "";
  render();
}

function togglePin(id) {
  notas = notas.map(n => {
    if (n.id === id) {
      return { ...n, pinned: !n.pinned, updatedAt: Date.now() };
    }
    return n;
  });
  save();
  render();
}

// 🔴 NOVO: confirmação antes de excluir
function confirmDelete(id) {
  if (confirm("Deseja excluir este paciente?")) {
    deleteNota(id);
  }
}

function render() {
  const search = searchInput.value.toLowerCase();

  listEl.innerHTML = "";

  notas
    .filter(n =>
      n.paciente.toLowerCase().includes(search) ||
      n.nota.toLowerCase().includes(search)
    )
    .sort((a, b) => {
      if ((a.pinned || false) !== (b.pinned || false)) {
        return (b.pinned || false) - (a.pinned || false);
      }
      return b.updatedAt - a.updatedAt;
    })
    .forEach(n => {

      const div = document.createElement("div");
      div.className = "card";

      if (n.pinned) {
        div.style.border = "2px solid #00c853";
      }

      const tags = extractTags(n.nota)
        .map(t => {
          const isActive = t === activeTag;
          return `<span class="tag ${isActive ? "active" : ""}" 
                  onclick="event.stopPropagation(); applyTagFilter('${t}')">
                  ${t}
                </span>`;
        })
        .join("");

      div.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <strong>${n.paciente} ${n.leito ? "- " + n.leito : ""}</strong>
          <span class="pin" onclick="event.stopPropagation(); togglePin(${n.id})">
            ${n.pinned ? "📌" : "📍"}
          </span>
        </div>
        <small>${n.nota.slice(0, 80)}</small><br>
        ${tags}
      `;

      div.onclick = () => openModal(n);

      // swipe para excluir
      let startX = 0;
      div.addEventListener("touchstart", e => startX = e.touches[0].clientX);
      div.addEventListener("touchend", e => {
        let endX = e.changedTouches[0].clientX;
        if (startX - endX > 100) {
          confirmDelete(n.id);
        }
      });

      // long press para excluir
      let pressTimer;
      div.onmousedown = () => {
        pressTimer = setTimeout(() => confirmDelete(n.id), 700);
      };
      div.onmouseup = () => clearTimeout(pressTimer);

      listEl.appendChild(div);
    });
}

function openModal(nota = null) {
  modal.style.display = "flex";

  if (nota) {
    editId = nota.id;
    paciente.value = nota.paciente;
    leito.value = nota.leito;
    notaField.value = nota.nota;
  } else {
    editId = null;
    paciente.value = "";
    leito.value = "";
    notaField.value = "";
  }

  paciente.focus();
}

function closeModal() {
  modal.style.display = "none";

  const pacienteVal = paciente.value.trim();
  if (!pacienteVal) return;

  const data = {
    id: editId || Date.now(),
    paciente: pacienteVal,
    leito: leito.value,
    nota: notaField.value,
    pinned: editId ? (notas.find(n => n.id === editId)?.pinned || false) : false,
    updatedAt: Date.now()
  };

  if (editId) {
    notas = notas.map(n => n.id === editId ? data : n);
  } else {
    notas.push(data);
  }

  save();
  render();
}

function deleteNota(id) {
  notas = notas.filter(n => n.id !== id);
  save();
  render();
}

function clearAll() {
  if (confirm("Encerrar plantão e apagar tudo?")) {
    notas = [];
    save();
    render();
  }
}

searchInput.addEventListener("input", () => {
  activeTag = null;
  render();
});

render();
