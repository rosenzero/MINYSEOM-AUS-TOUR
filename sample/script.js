const STORAGE_KEY = "aus_tour_data_v1";
const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 5; h <= 23; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 23) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

let data = null;

/* ---------------- Load / Save ---------------- */
async function loadData() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try { data = JSON.parse(cached); return; } catch (e) {}
  }
  const res = await fetch("data.json");
  data = await res.json();
  persist();
}
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function renderAll() {
  renderInfo();
  renderSchedule();
  renderStay();
  renderPacking();
  renderExpense();
}

/* ---------------- Info ---------------- */
function renderInfo() {
  document.getElementById("tripTitle").textContent = data.info.title || "여행";
  const s = data.info.startDate, e = data.info.endDate;
  document.getElementById("tripDates").textContent = (s && e) ? `${s} ~ ${e}` : "";
  const dday = computeDDay(s);
  document.getElementById("tripDDay").textContent = dday;

  const form = document.getElementById("infoForm");
  form.title.value = data.info.title || "";
  form.startDate.value = data.info.startDate || "";
  form.endDate.value = data.info.endDate || "";
  form.members.value = (data.info.members || []).join(", ");
}
function computeDDay(startDate) {
  if (!startDate) return "";
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startDate); start.setHours(0,0,0,0);
  const diff = Math.round((start - today) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  if (diff >= -7) return `여행 ${-diff}일차`;
  return "종료";
}
document.getElementById("infoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  data.info.title = fd.get("title");
  data.info.startDate = fd.get("startDate");
  data.info.endDate = fd.get("endDate");
  data.info.members = fd.get("members").split(",").map(s => s.trim()).filter(Boolean);
  persist();
  renderInfo();
  flash("저장되었습니다");
});

/* ---------------- Schedule ---------------- */
function renderSchedule() {
  const table = document.getElementById("scheduleTable");
  const days = data.days;

  // Build a map: [dayIdx][timeIdx] -> event ref (or null)
  const grid = days.map(() => Array(TIME_SLOTS.length).fill(null));
  const rowspans = days.map(() => Array(TIME_SLOTS.length).fill(0));

  data.events.forEach((ev, idx) => {
    const startIdx = TIME_SLOTS.indexOf(ev.start);
    let endIdx = TIME_SLOTS.indexOf(ev.end);
    if (startIdx === -1) return;
    if (endIdx === -1 || endIdx < startIdx) endIdx = startIdx;
    for (let i = startIdx; i <= endIdx; i++) {
      grid[ev.dayIdx][i] = { idx, top: i === startIdx };
    }
    rowspans[ev.dayIdx][startIdx] = endIdx - startIdx + 1;
  });

  // Build HTML
  let html = "<thead><tr><th class='time-col'>시간</th>";
  days.forEach(d => { html += `<th>${d.date} (${d.day})</th>`; });
  html += "</tr></thead><tbody>";

  TIME_SLOTS.forEach((time, tIdx) => {
    html += `<tr><td class="time-col">${time}</td>`;
    days.forEach((_, dIdx) => {
      const cell = grid[dIdx][tIdx];
      if (cell && !cell.top) return;
      if (cell && cell.top) {
        const ev = data.events[cell.idx];
        const span = rowspans[dIdx][tIdx];
        html += `<td class="event" rowspan="${span}" data-event="${cell.idx}">${escapeHtml(ev.title)}</td>`;
      } else {
        html += `<td class="empty" data-empty="${dIdx},${time}"></td>`;
      }
    });
    html += "</tr>";
  });
  html += "</tbody>";
  table.innerHTML = html;

  table.querySelectorAll("td.event").forEach(td => {
    td.addEventListener("click", () => openEventModal(parseInt(td.dataset.event)));
  });
  table.querySelectorAll("td.empty").forEach(td => {
    td.addEventListener("click", () => {
      const [dIdx, time] = td.dataset.empty.split(",");
      openEventModal(null, { dayIdx: parseInt(dIdx), start: time, end: time, title: "" });
    });
  });
}

function openEventModal(editIdx, preset) {
  const ev = editIdx != null ? { ...data.events[editIdx] } : (preset || { dayIdx: 0, start: "09:00", end: "10:00", title: "" });
  const dayOptions = data.days.map((d, i) =>
    `<option value="${i}" ${i === ev.dayIdx ? "selected" : ""}>${d.date} (${d.day})</option>`
  ).join("");
  const timeOptions = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join("");

  openModal(editIdx != null ? "일정 수정" : "일정 추가", `
    <label>날짜<select name="dayIdx">${dayOptions}</select></label>
    <label>시작<select name="start">${timeOptions}</select></label>
    <label>종료<select name="end">${timeOptions}</select></label>
    <label>제목<input name="title" value="${escapeAttr(ev.title)}" required /></label>
  `, (form) => {
    const fd = new FormData(form);
    const newEv = {
      dayIdx: parseInt(fd.get("dayIdx")),
      start: fd.get("start"),
      end: fd.get("end"),
      title: fd.get("title").trim(),
    };
    if (editIdx != null) data.events[editIdx] = newEv;
    else data.events.push(newEv);
    persist(); renderSchedule();
  }, editIdx != null ? () => {
    data.events.splice(editIdx, 1);
    persist(); renderSchedule();
  } : null, (form) => {
    form.start.value = ev.start;
    form.end.value = ev.end;
  });
}

document.getElementById("btnAddEvent").addEventListener("click", () => openEventModal(null));

/* ---------------- Accommodations ---------------- */
function renderStay() {
  const el = document.getElementById("stayList");
  if (!data.accommodations.length) {
    el.innerHTML = '<p class="muted">등록된 숙소가 없습니다.</p>';
    return;
  }
  el.innerHTML = data.accommodations.map((s, i) => `
    <div class="card">
      <span class="city-tag">${escapeHtml(s.city || "")}</span>
      <h3>${escapeHtml(s.name)}</h3>
      <div class="card-row"><span class="label">체크인</span><span>${s.checkIn || "-"}</span></div>
      <div class="card-row"><span class="label">체크아웃</span><span>${s.checkOut || "-"}</span></div>
      <div class="card-row"><span class="label">주소</span><span>${escapeHtml(s.address || "-")}</span></div>
      <div class="card-row"><span class="label">가격</span><span>${s.price ? s.price.toLocaleString() : "-"}</span></div>
      <div class="card-row"><span class="label">예약번호</span><span>${escapeHtml(s.confirmation || "-")}</span></div>
      ${s.notes ? `<div class="card-row"><span class="label">메모</span><span>${escapeHtml(s.notes)}</span></div>` : ""}
      <div class="card-actions">
        <button class="btn btn-icon" data-edit-stay="${i}">수정</button>
      </div>
    </div>
  `).join("");
  el.querySelectorAll("[data-edit-stay]").forEach(b =>
    b.addEventListener("click", () => openStayModal(parseInt(b.dataset.editStay)))
  );
}
function openStayModal(editIdx) {
  const s = editIdx != null ? { ...data.accommodations[editIdx] } : { name: "", city: "", checkIn: "", checkOut: "", address: "", price: 0, confirmation: "", notes: "" };
  openModal(editIdx != null ? "숙소 수정" : "숙소 추가", `
    <label>숙소 이름<input name="name" value="${escapeAttr(s.name)}" required /></label>
    <label>도시<input name="city" value="${escapeAttr(s.city)}" /></label>
    <label>체크인<input name="checkIn" type="date" value="${s.checkIn || ""}" /></label>
    <label>체크아웃<input name="checkOut" type="date" value="${s.checkOut || ""}" /></label>
    <label>주소<input name="address" value="${escapeAttr(s.address)}" /></label>
    <label>가격<input name="price" type="number" value="${s.price || 0}" /></label>
    <label>예약번호<input name="confirmation" value="${escapeAttr(s.confirmation)}" /></label>
    <label>메모<textarea name="notes" rows="2">${escapeHtml(s.notes || "")}</textarea></label>
  `, (form) => {
    const fd = new FormData(form);
    const updated = {
      name: fd.get("name").trim(),
      city: fd.get("city").trim(),
      checkIn: fd.get("checkIn"),
      checkOut: fd.get("checkOut"),
      address: fd.get("address").trim(),
      price: parseFloat(fd.get("price")) || 0,
      confirmation: fd.get("confirmation").trim(),
      notes: fd.get("notes").trim(),
    };
    if (editIdx != null) data.accommodations[editIdx] = updated;
    else data.accommodations.push(updated);
    persist(); renderStay();
  }, editIdx != null ? () => {
    data.accommodations.splice(editIdx, 1);
    persist(); renderStay();
  } : null);
}
document.getElementById("btnAddStay").addEventListener("click", () => openStayModal(null));

/* ---------------- Packing ---------------- */
function renderPacking() {
  const groups = {};
  data.packing.forEach((p, i) => {
    (groups[p.category] = groups[p.category] || []).push({ ...p, _idx: i });
  });
  const el = document.getElementById("packingGroups");
  el.innerHTML = Object.entries(groups).map(([cat, items]) => `
    <div class="pack-group">
      <h3>${escapeHtml(cat)}</h3>
      ${items.map(it => `
        <div class="pack-item ${it.done ? "done" : ""}">
          <input type="checkbox" data-pack-toggle="${it._idx}" ${it.done ? "checked" : ""} />
          <span class="pack-label" data-pack-edit="${it._idx}">${escapeHtml(it.item)}</span>
          <button class="pack-delete" data-pack-del="${it._idx}" title="삭제">✕</button>
        </div>
      `).join("")}
    </div>
  `).join("");

  el.querySelectorAll("[data-pack-toggle]").forEach(cb =>
    cb.addEventListener("change", () => {
      const i = parseInt(cb.dataset.packToggle);
      data.packing[i].done = cb.checked;
      persist(); renderPacking();
    })
  );
  el.querySelectorAll("[data-pack-edit]").forEach(lbl =>
    lbl.addEventListener("click", () => openPackModal(parseInt(lbl.dataset.packEdit)))
  );
  el.querySelectorAll("[data-pack-del]").forEach(btn =>
    btn.addEventListener("click", () => {
      if (!confirm("삭제하시겠습니까?")) return;
      data.packing.splice(parseInt(btn.dataset.packDel), 1);
      persist(); renderPacking();
    })
  );

  const total = data.packing.length;
  const done = data.packing.filter(p => p.done).length;
  document.getElementById("packingProgress").textContent = `${done} / ${total} 완료`;
}
function openPackModal(editIdx) {
  const p = editIdx != null ? { ...data.packing[editIdx] } : { category: "기타", item: "", done: false };
  const categories = [...new Set(data.packing.map(x => x.category))];
  openModal(editIdx != null ? "준비물 수정" : "준비물 추가", `
    <label>분류<input name="category" list="catList" value="${escapeAttr(p.category)}" required />
      <datalist id="catList">${categories.map(c => `<option value="${escapeAttr(c)}">`).join("")}</datalist>
    </label>
    <label>항목<input name="item" value="${escapeAttr(p.item)}" required /></label>
  `, (form) => {
    const fd = new FormData(form);
    const updated = {
      category: fd.get("category").trim(),
      item: fd.get("item").trim(),
      done: p.done,
    };
    if (editIdx != null) data.packing[editIdx] = updated;
    else data.packing.push(updated);
    persist(); renderPacking();
  }, editIdx != null ? () => {
    data.packing.splice(editIdx, 1);
    persist(); renderPacking();
  } : null);
}
document.getElementById("btnAddPack").addEventListener("click", () => openPackModal(null));

/* ---------------- Expense ---------------- */
function renderExpense() {
  const tbody = document.querySelector("#expenseTable tbody");
  if (!data.expenses.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center;padding:20px">기록된 지출이 없습니다.</td></tr>`;
  } else {
    tbody.innerHTML = data.expenses.map((x, i) => `
      <tr>
        <td>${x.date || "-"}</td>
        <td>${escapeHtml(x.category || "-")}</td>
        <td>${escapeHtml(x.item || "-")}</td>
        <td class="num">${(x.amount || 0).toLocaleString()}</td>
        <td>${escapeHtml(x.currency || "")}</td>
        <td>${escapeHtml(x.paidBy || "-")}</td>
        <td><button class="btn btn-icon" data-edit-exp="${i}">수정</button></td>
      </tr>
    `).join("");
    tbody.querySelectorAll("[data-edit-exp]").forEach(b =>
      b.addEventListener("click", () => openExpenseModal(parseInt(b.dataset.editExp)))
    );
  }

  const byCurrency = {};
  data.expenses.forEach(x => {
    const c = x.currency || "?";
    byCurrency[c] = (byCurrency[c] || 0) + (x.amount || 0);
  });
  const totalRecords = data.expenses.length;
  const summary = document.getElementById("expenseSummary");
  summary.innerHTML = `
    <div class="summary-card">
      <div class="label">지출 항목</div>
      <div class="value">${totalRecords} 건</div>
    </div>
    ${Object.entries(byCurrency).map(([c, v]) => `
      <div class="summary-card">
        <div class="label">${escapeHtml(c)} 합계</div>
        <div class="value">${v.toLocaleString()} ${escapeHtml(c)}</div>
      </div>
    `).join("")}
  `;
}
function openExpenseModal(editIdx) {
  const x = editIdx != null ? { ...data.expenses[editIdx] } : { date: "", category: "", item: "", amount: 0, currency: "KRW", paidBy: "" };
  const categories = ["항공권", "숙박", "식비", "교통", "액티비티", "쇼핑", "기타"];
  openModal(editIdx != null ? "지출 수정" : "지출 추가", `
    <label>날짜<input name="date" type="date" value="${x.date || ""}" /></label>
    <label>분류
      <select name="category">
        ${categories.map(c => `<option ${c === x.category ? "selected" : ""}>${c}</option>`).join("")}
      </select>
    </label>
    <label>항목<input name="item" value="${escapeAttr(x.item)}" required /></label>
    <label>금액<input name="amount" type="number" step="0.01" value="${x.amount || 0}" /></label>
    <label>통화
      <select name="currency">
        <option ${x.currency === "KRW" ? "selected" : ""}>KRW</option>
        <option ${x.currency === "AUD" ? "selected" : ""}>AUD</option>
        <option ${x.currency === "USD" ? "selected" : ""}>USD</option>
      </select>
    </label>
    <label>결제자<input name="paidBy" value="${escapeAttr(x.paidBy)}" /></label>
  `, (form) => {
    const fd = new FormData(form);
    const updated = {
      date: fd.get("date"),
      category: fd.get("category"),
      item: fd.get("item").trim(),
      amount: parseFloat(fd.get("amount")) || 0,
      currency: fd.get("currency"),
      paidBy: fd.get("paidBy").trim(),
    };
    if (editIdx != null) data.expenses[editIdx] = updated;
    else data.expenses.push(updated);
    persist(); renderExpense();
  }, editIdx != null ? () => {
    data.expenses.splice(editIdx, 1);
    persist(); renderExpense();
  } : null);
}
document.getElementById("btnAddExpense").addEventListener("click", () => openExpenseModal(null));

/* ---------------- Modal ---------------- */
function openModal(title, bodyHtml, onSave, onDelete, afterRender) {
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = title;
  const form = document.getElementById("modalForm");
  form.innerHTML = bodyHtml;
  if (afterRender) afterRender(form);
  modal.classList.remove("hidden");

  const delBtn = document.getElementById("modalDelete");
  delBtn.classList.toggle("hidden", !onDelete);
  delBtn.onclick = () => {
    if (!confirm("삭제하시겠습니까?")) return;
    onDelete(); closeModal();
  };
  document.getElementById("modalSave").onclick = () => {
    if (!form.reportValidity()) return;
    onSave(form); closeModal();
  };
  document.getElementById("modalCancel").onclick = closeModal;
}
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

/* ---------------- Tabs ---------------- */
document.querySelectorAll(".tab").forEach(t =>
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("tab-" + t.dataset.tab).classList.add("active");
  })
);

/* ---------------- Export / Import / Reset ---------------- */
document.getElementById("btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trip.json";
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("fileImport").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const loaded = JSON.parse(text);
    if (!loaded.info || !loaded.days || !loaded.events) throw new Error("형식이 맞지 않습니다");
    data = loaded;
    persist(); renderAll();
    flash("불러오기 완료");
  } catch (err) {
    alert("불러오기 실패: " + err.message);
  }
  e.target.value = "";
});
document.getElementById("btnReset").addEventListener("click", async () => {
  if (!confirm("저장된 데이터를 모두 지우고 초기 데이터로 되돌리시겠습니까?")) return;
  localStorage.removeItem(STORAGE_KEY);
  const res = await fetch("data.json");
  data = await res.json();
  persist(); renderAll();
  flash("초기화 완료");
});

/* ---------------- Helpers ---------------- */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(s) { return escapeHtml(s); }
function flash(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:10px 16px;border-radius:8px;z-index:200;opacity:0;transition:opacity .2s";
  document.body.appendChild(el);
  requestAnimationFrame(() => el.style.opacity = "1");
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 200); }, 1500);
}

/* ---------------- Boot ---------------- */
loadData().then(renderAll);
