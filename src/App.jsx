import { useState, useEffect } from "react";

// ─── DADOS ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "todos", label: "🍔 Todos" },
  { id: "lanches", label: "🥪 Lanches" },
  { id: "combos", label: "🎁 Combos" },
  { id: "bebidas", label: "🥤 Bebidas" },
  { id: "sobremesas", label: "🍦 Sobremesas" },
];

const PRODUCTS = [
  { id: 1, name: "X-Burguer Clássico", category: "lanches", price: 22.9, description: "Pão brioche, blend 180g, queijo cheddar, alface e tomate", tag: "🔥 Mais Pedido", tagColor: "#FF4B2B", emoji: "🍔", rating: 4.9, time: "20-30" },
  { id: 2, name: "X-Bacon Duplo", category: "lanches", price: 31.9, description: "Dois blends 150g, bacon crocante, queijo prato", emoji: "🥩", rating: 4.8, time: "25-35" },
  { id: 3, name: "Combo Família", category: "combos", price: 54.9, oldPrice: 68.0, description: "2 X-Burguer + 2 batatas + 2 refrigerantes", tag: "💰 Oferta", tagColor: "#27AE60", emoji: "🎁", rating: 4.7, time: "30-40" },
  { id: 4, name: "Combo Individual", category: "combos", price: 32.9, description: "X-Burguer + batata média + refrigerante", emoji: "🍟", rating: 4.6, time: "20-30" },
  { id: 5, name: "Coca-Cola 600ml", category: "bebidas", price: 8.9, description: "Garrafa gelada", emoji: "🥤", rating: 4.5, time: "5-10" },
  { id: 6, name: "Milkshake Chocolate", category: "bebidas", price: 18.9, description: "400ml cremoso com chantilly", tag: "✨ Novo", tagColor: "#2980B9", emoji: "🍫", rating: 4.9, time: "10-15" },
  { id: 7, name: "Sundae de Morango", category: "sobremesas", price: 12.9, description: "Sorvete cremoso com calda de morango", emoji: "🍦", rating: 4.7, time: "5-10" },
  { id: 8, name: "Brownie com Sorvete", category: "sobremesas", price: 16.9, description: "Brownie quentinho + sorvete de baunilha", tag: "🔥 Popular", tagColor: "#E74C3C", emoji: "🍫", rating: 4.8, time: "10-15" },
];

// Regras de fidelidade
const CASHBACK_RATE = 0.05;       // 5%
const MAX_CASHBACK = 10;          // R$ 10 máximo acumulado
const POINTS_MIN_VALUE = 30;      // compra acima de R$ 30 ganha 1 ponto
const POINTS_TO_REDEEM = 25;      // 25 pontos = 1 lanche grátis
const POINTS_REWARD_NAME = "X-Burguer Clássico"; // prêmio dos pontos

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
function saveUsers(users) { localStorage.setItem("lanche_users", JSON.stringify(users)); }
function loadUsers() { try { return JSON.parse(localStorage.getItem("lanche_users") || "[]"); } catch { return []; } }
function saveSession(user) { localStorage.setItem("lanche_session", JSON.stringify(user)); }
function loadSession() { try { return JSON.parse(localStorage.getItem("lanche_session")); } catch { return null; } }
function clearSession() { localStorage.removeItem("lanche_session"); }
function updateUserInStorage(updated) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === updated.email);
  if (idx >= 0) { users[idx] = updated; saveUsers(users); saveSession(updated); }
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | login | register | profile | admin | checkout
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [useCashback, setUseCashback] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
  const s = loadSession();
  if (s) {
    const users = loadUsers();
    const fresh = users.find(u => u.email === s.email);
    if (fresh) {
      setUser(fresh);
      saveSession(fresh);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function login(email, password) {
    const users = loadUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return "E-mail ou senha incorretos.";
    setUser(found); saveSession(found);
    setScreen("home"); showToast(`Bem-vindo, ${found.name.split(" ")[0]}! 👋`);
    return null;
  }

  function register(name, email, phone, password) {
    const users = loadUsers();
    if (users.find(u => u.email === email)) return "Este e-mail já está cadastrado.";
    const newUser = { name, email, phone, password, points: 0, cashback: 0, orders: [] };
    users.push(newUser); saveUsers(users);
    setUser(newUser); saveSession(newUser);
    setScreen("home"); showToast(`Cadastro realizado! Bem-vindo, ${name.split(" ")[0]}! 🎉`);
    return null;
  }

  function logout() { clearSession(); setUser(null); setScreen("home"); showToast("Até logo! 👋", "info"); }

  function addToCart(product) {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id);
      if (found) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart(prev => {
      const found = prev.find(i => i.id === id);
      if (found && found.qty > 1) return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
  }

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cashbackDiscount = useCashback && user ? Math.min(user.cashback, MAX_CASHBACK, subtotal) : 0;
  const total = Math.max(0, subtotal - cashbackDiscount + (subtotal >= 40 ? 0 : 5));

  function finalizeOrder() {
    if (!user) { setCartOpen(false); setScreen("login"); showToast("Faça login para finalizar o pedido", "info"); return; }

    const orderTotal = subtotal;
    const earnedCashback = parseFloat((orderTotal * CASHBACK_RATE).toFixed(2));
    const earnedPoints = orderTotal >= POINTS_MIN_VALUE ? 1 : 0;

    let newCashback = parseFloat((user.cashback - cashbackDiscount + earnedCashback).toFixed(2));
    newCashback = Math.min(newCashback, MAX_CASHBACK);

    const order = {
      id: Number(Date.now()),
      date: new Date().toLocaleDateString("pt-BR"),
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: orderTotal,
      cashbackUsed: cashbackDiscount,
      cashbackEarned: earnedCashback,
      pointsEarned: earnedPoints,
    };

    const updated = {
      ...user,
      cashback: newCashback,
      points: user.points + earnedPoints,
      orders: [order, ...(user.orders || [])],
    };

    updateUserInStorage(updated);
    setUser(updated);
    setCart([]);
    setUseCashback(false);
    setCartOpen(false);
    setOrderSuccess({ earnedCashback, earnedPoints, cashbackDiscount });
    setTimeout(() => setOrderSuccess(null), 4000);
  }

  function redeemPoints() {
    if (!user || user.points < POINTS_TO_REDEEM) return;
    const updated = { ...user, points: user.points - POINTS_TO_REDEEM };
    updateUserInStorage(updated); setUser(updated);
    showToast(`🎉 Resgatado! Seu ${POINTS_REWARD_NAME} grátis foi liberado!`);
  }

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === "todos" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const allUsers = loadUsers().filter(u => u.email !== "admin@lanchonete.com");

  // ── TELAS ──
  if (screen === "login") return <LoginScreen login={login} goRegister={() => setScreen("register")} goBack={() => setScreen("home")} />;
  if (screen === "register") return <RegisterScreen register={register} goLogin={() => setScreen("login")} goBack={() => setScreen("home")} />;
  if (screen === "profile" && user) return <ProfileScreen user={user} logout={logout} goBack={() => setScreen("home")} redeemPoints={redeemPoints} POINTS_TO_REDEEM={POINTS_TO_REDEEM} MAX_CASHBACK={MAX_CASHBACK} />;
  if (screen === "admin") return <AdminScreen users={allUsers} goBack={() => setScreen("home")} />;

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F7F8FA", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .btn-scale { transition: transform 0.15s; cursor: pointer; }
        .btn-scale:active { transform: scale(0.95); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes pop { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .slide-up { animation: slideUp 0.3s cubic-bezier(.4,0,.2,1); }
        .fade-in { animation: fadeIn 0.22s ease; }
        .pop { animation: pop 0.35s cubic-bezier(.4,0,.2,1); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: toast.type === "info" ? "#1A1A2E" : "#27AE60", color: "#fff", padding: "12px 20px", borderRadius: 14, fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }} className="pop">
          {toast.msg}
        </div>
      )}

      {/* Order Success */}
      {orderSuccess && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div className="pop" style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", textAlign: "center", maxWidth: 300, margin: "0 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 10 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: "#1A1A2E", marginBottom: 8 }}>Pedido Confirmado!</div>
            {orderSuccess.cashbackDiscount > 0 && <div style={{ fontSize: 13, color: "#27AE60", marginBottom: 4 }}>✅ R$ {orderSuccess.cashbackDiscount.toFixed(2)} de cashback usado</div>}
            <div style={{ fontSize: 13, color: "#FF4B2B", marginBottom: 4 }}>💰 +R$ {orderSuccess.earnedCashback.toFixed(2)} de cashback ganho</div>
            {orderSuccess.earnedPoints > 0 && <div style={{ fontSize: 13, color: "#F5A623", marginBottom: 4 }}>⭐ +1 ponto de fidelidade!</div>}
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>Seu lanche está sendo preparado 🍔🛵</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #FF4B2B 0%, #FF6B35 100%)", padding: "18px 20px 22px", borderRadius: "0 0 24px 24px", boxShadow: "0 4px 20px rgba(255,75,43,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>📍 Entregando em</div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>Rua das Flores, 142 ▾</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {user?.email === "admin@lanchonete.com" && (
              <button onClick={() => setScreen("admin")} className="btn-scale" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 42, height: 42, fontSize: 18, cursor: "pointer" }}>🏪</button>
            )}
            <button onClick={() => user ? setScreen("profile") : setScreen("login")} className="btn-scale" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 42, height: 42, fontSize: 20, cursor: "pointer", position: "relative" }}>
              {user ? "👤" : "🔑"}
            </button>
          </div>
        </div>
        {user && (
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Olá, {user.name.split(" ")[0]}! 👋</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ color: "#fff", fontSize: 12, textAlign: "center" }}>
                <div style={{ fontWeight: 900 }}>⭐ {user.points}</div>
                <div style={{ opacity: 0.8, fontSize: 10 }}>pontos</div>
              </div>
              <div style={{ color: "#fff", fontSize: 12, textAlign: "center" }}>
                <div style={{ fontWeight: 900 }}>💰 R${user.cashback.toFixed(2)}</div>
                <div style={{ opacity: 0.8, fontSize: 10 }}>cashback</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", padding: "10px 14px", gap: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lanche, combo..." style={{ border: "none", outline: "none", width: "100%", fontSize: 14, fontFamily: "inherit", color: "#333", background: "transparent" }} />
        </div>
      </div>

      <div style={{ padding: "0 0 110px" }}>
        {/* Fidelidade banner */}
        {!user && (
          <div style={{ margin: "16px 20px 0", background: "linear-gradient(135deg, #1A1A2E, #2D2D5E)", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Programa de Fidelidade</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Cadastre-se e ganhe pontos + cashback em toda compra!</div>
              <button onClick={() => setScreen("register")} style={{ marginTop: 8, background: "#FF4B2B", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                Criar conta grátis →
              </button>
            </div>
          </div>
        )}

        {user && (
          <div style={{ margin: "16px 20px 0", background: "linear-gradient(135deg, #1A1A2E, #2D2D5E)", borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>🏆 Sua Fidelidade</div>
              <button onClick={() => setScreen("profile")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Ver tudo →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ color: "#F5A623", fontSize: 22, fontWeight: 900 }}>⭐ {user.points}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>pontos acumulados</div>
                <div style={{ marginTop: 4, background: "rgba(255,255,255,0.15)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                  <div style={{ background: "#F5A623", height: "100%", width: `${Math.min((user.points / POINTS_TO_REDEEM) * 100, 100)}%`, borderRadius: 6, transition: "width 0.5s" }} />
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 3 }}>{user.points}/{POINTS_TO_REDEEM} para resgatar</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ color: "#2ECC71", fontSize: 22, fontWeight: 900 }}>💰 R${user.cashback.toFixed(2)}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>cashback disponível</div>
                <div style={{ marginTop: 4, background: "rgba(255,255,255,0.15)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                  <div style={{ background: "#2ECC71", height: "100%", width: `${Math.min((user.cashback / MAX_CASHBACK) * 100, 100)}%`, borderRadius: 6, transition: "width 0.5s" }} />
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 3 }}>máx R${MAX_CASHBACK}</div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div style={{ padding: "16px 0 0 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1A1A2E", marginBottom: 10 }}>Categorias</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, paddingRight: 20 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)} className="btn-scale" style={{ background: category === cat.id ? "#FF4B2B" : "#fff", color: category === cat.id ? "#fff" : "#444", border: "none", borderRadius: 12, padding: "8px 16px", fontSize: 13, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", cursor: "pointer", boxShadow: category === cat.id ? "0 4px 12px rgba(255,75,43,0.35)" : "0 2px 8px rgba(0,0,0,0.06)" }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E", marginBottom: 12 }}>{filtered.length} itens</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              return (
                <div key={product.id} style={{ background: "#fff", borderRadius: 20, padding: 16, display: "flex", gap: 14, alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", position: "relative", overflow: "hidden" }}>
                  {product.tag && <div style={{ position: "absolute", top: 10, right: 10, background: product.tagColor, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>{product.tag}</div>}
                  <div style={{ width: 74, height: 74, borderRadius: 16, background: "linear-gradient(135deg,#FFF3EC,#FFE5DA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>{product.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E", marginBottom: 3 }}>{product.name}</div>
                    <div style={{ fontSize: 11.5, color: "#888", marginBottom: 6 }}>{product.description}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#F5A623", fontWeight: 700 }}>⭐ {product.rating}</span>
                      <span style={{ color: "#ddd" }}>•</span>
                      <span style={{ fontSize: 12, color: "#999" }}>⏱ {product.time} min</span>
                      {product.price >= POINTS_MIN_VALUE && <span style={{ fontSize: 10, color: "#F5A623", background: "#FFF8E1", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>+1 ponto</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        {product.oldPrice && <span style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through", marginRight: 4 }}>R$ {product.oldPrice.toFixed(2)}</span>}
                        <span style={{ fontSize: 17, fontWeight: 900, color: "#FF4B2B" }}>R$ {product.price.toFixed(2)}</span>
                        <div style={{ fontSize: 10, color: "#27AE60", fontWeight: 700 }}>+R$ {(product.price * CASHBACK_RATE).toFixed(2)} cashback</div>
                      </div>
                      {inCart ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button onClick={() => removeFromCart(product.id)} className="btn-scale" style={{ background: "#FFF3EC", border: "none", borderRadius: 8, width: 28, height: 28, fontSize: 18, color: "#FF4B2B", cursor: "pointer", fontWeight: 900 }}>−</button>
                          <span style={{ fontWeight: 800, color: "#1A1A2E", minWidth: 16, textAlign: "center" }}>{inCart.qty}</span>
                          <button onClick={() => addToCart(product)} className="btn-scale" style={{ background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", border: "none", borderRadius: 8, width: 28, height: 28, fontSize: 18, color: "#fff", cursor: "pointer", fontWeight: 900 }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="btn-scale" style={{ background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", border: "none", borderRadius: 10, width: 34, height: 34, fontSize: 20, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,75,43,0.4)" }}>+</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart FAB */}
      {totalItems > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: 440, zIndex: 100 }}>
          <button onClick={() => setCartOpen(true)} style={{ width: "100%", background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", color: "#fff", border: "none", borderRadius: 18, padding: "16px 20px", fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 24px rgba(255,75,43,0.45)" }}>
            <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 8, padding: "3px 10px", fontSize: 13 }}>{totalItems} item{totalItems > 1 ? "s" : ""}</div>
            <span>🛒 Ver Sacola</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <div className="slide-up" style={{ position: "relative", background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 32px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#1A1A2E" }}>🛒 Minha Sacola</div>
              <button onClick={() => setCartOpen(false)} style={{ background: "#F7F8FA", border: "none", borderRadius: 10, width: 34, height: 34, fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#F7F8FA", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 26 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>{item.name}</div>
                  <div style={{ fontWeight: 700, color: "#FF4B2B", fontSize: 13 }}>R$ {(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => removeFromCart(item.id)} className="btn-scale" style={{ background: "#fff", border: "1px solid #eee", borderRadius: 7, width: 26, height: 26, fontSize: 16, cursor: "pointer", color: "#FF4B2B", fontWeight: 900 }}>−</button>
                  <span style={{ fontWeight: 800, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                  <button onClick={() => addToCart(item)} className="btn-scale" style={{ background: "#FF4B2B", border: "none", borderRadius: 7, width: 26, height: 26, fontSize: 16, cursor: "pointer", color: "#fff", fontWeight: 900 }}>+</button>
                </div>
              </div>
            ))}

            {/* Cashback toggle */}
            {user && user.cashback > 0 && (
              <div style={{ background: "#F0FFF4", border: "1.5px solid #27AE60", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>💰 Usar Cashback</div>
                    <div style={{ fontSize: 12, color: "#27AE60" }}>Você tem R$ {user.cashback.toFixed(2)} disponível</div>
                  </div>
                  <button onClick={() => setUseCashback(!useCashback)} style={{ background: useCashback ? "#27AE60" : "#ddd", border: "none", borderRadius: 20, width: 46, height: 26, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 3, left: useCashback ? 23 : 3, width: 20, height: 20, background: "#fff", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                  </button>
                </div>
                {useCashback && <div style={{ marginTop: 8, fontSize: 13, color: "#27AE60", fontWeight: 700 }}>✅ −R$ {cashbackDiscount.toFixed(2)} de desconto aplicado</div>}
              </div>
            )}

            {/* Totals */}
            <div style={{ borderTop: "1.5px dashed #eee", paddingTop: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 5 }}>
                <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {cashbackDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#27AE60", marginBottom: 5, fontWeight: 700 }}>
                  <span>Cashback usado</span><span>−R$ {cashbackDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 5 }}>
                <span>Entrega</span><span style={{ color: subtotal >= 40 ? "#27AE60" : "#888", fontWeight: subtotal >= 40 ? 700 : 400 }}>{subtotal >= 40 ? "Grátis 🎉" : "R$ 5,00"}</span>
              </div>
              {user && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#27AE60", marginBottom: 5, fontWeight: 700 }}>
                  <span>💰 Cashback que vai ganhar</span><span>+R$ {(subtotal * CASHBACK_RATE).toFixed(2)}</span>
                </div>
              )}
              {user && subtotal >= POINTS_MIN_VALUE && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#F5A623", fontWeight: 700, marginBottom: 5 }}>
                  <span>⭐ Pontos que vai ganhar</span><span>+1 ponto</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#1A1A2E", marginTop: 10 }}>
                <span>Total</span><span style={{ color: "#FF4B2B" }}>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={finalizeOrder} style={{ width: "100%", background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", color: "#fff", border: "none", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 900, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 6px 20px rgba(255,75,43,0.4)" }}>
              {user ? "Finalizar Pedido 🚀" : "Entrar para Finalizar 🔑"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TELA DE LOGIN ────────────────────────────────────────────────────────────
function LoginScreen({ login, goRegister, goBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (!email || !password) { setError("Preencha todos os campos."); return; }
    setLoading(true);
    setTimeout(() => {
      const err = login(email, password);
      if (err) { setError(err); setLoading(false); }
    }, 400);
  }

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F7F8FA", minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <div style={{ background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", padding: "50px 20px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 52 }}>🍔</div>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginTop: 8 }}>Entrar na conta</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Acesse seus pontos e cashback</div>
      </div>
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {error && <div style={{ background: "#FFF0EE", border: "1.5px solid #FF4B2B", borderRadius: 12, padding: "10px 14px", color: "#FF4B2B", fontSize: 13, fontWeight: 700 }}>{error}</div>}
        {["E-mail", "Senha"].map((label, i) => (
          <div key={label}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>{label}</div>
            <input type={i === 1 ? "password" : "email"} value={i === 0 ? email : password} onChange={e => i === 0 ? setEmail(e.target.value) : setPassword(e.target.value)} placeholder={i === 0 ? "seu@email.com" : "••••••••"} style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "1.5px solid #E0E0E0", fontSize: 15, fontFamily: "inherit", outline: "none", background: "#fff" }} />
          </div>
        ))}
        <button onClick={handleLogin} disabled={loading} style={{ background: loading ? "#ccc" : "linear-gradient(135deg,#FF4B2B,#FF6B35)", color: "#fff", border: "none", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 900, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", marginTop: 8, boxShadow: "0 6px 20px rgba(255,75,43,0.3)" }}>
          {loading ? "Entrando..." : "Entrar →"}
        </button>
        <div style={{ textAlign: "center", fontSize: 14, color: "#888" }}>
          Não tem conta?{" "}
          <span onClick={goRegister} style={{ color: "#FF4B2B", fontWeight: 800, cursor: "pointer" }}>Cadastrar grátis</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 14, color: "#888" }}>
          <span onClick={goBack} style={{ color: "#888", cursor: "pointer" }}>← Voltar ao cardápio</span>
        </div>
      </div>
    </div>
  );
}

// ─── TELA DE CADASTRO ─────────────────────────────────────────────────────────
function RegisterScreen({ register, goLogin, goBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRegister() {
    if (!name || !email || !phone || !password) { setError("Preencha todos os campos."); return; }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    setTimeout(() => {
      const err = register(name, email, phone, password);
      if (err) { setError(err); setLoading(false); }
    }, 400);
  }

  const fields = [
    { label: "Nome completo", value: name, set: setName, type: "text", placeholder: "João Silva" },
    { label: "E-mail", value: email, set: setEmail, type: "email", placeholder: "seu@email.com" },
    { label: "Telefone / WhatsApp", value: phone, set: setPhone, type: "tel", placeholder: "(11) 99999-9999" },
    { label: "Senha", value: password, set: setPassword, type: "password", placeholder: "mínimo 6 caracteres" },
  ];

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F7F8FA", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <div style={{ background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", padding: "50px 20px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 52 }}>🏆</div>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginTop: 8 }}>Criar conta grátis</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Ganhe pontos e cashback em toda compra!</div>
      </div>
      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {error && <div style={{ background: "#FFF0EE", border: "1.5px solid #FF4B2B", borderRadius: 12, padding: "10px 14px", color: "#FF4B2B", fontSize: 13, fontWeight: 700 }}>{error}</div>}
        <div style={{ background: "#FFF8E1", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 24 }}>🎁</span>
          <div style={{ fontSize: 12, color: "#666" }}>
            <strong>Benefícios:</strong> Ganhe 5% de cashback + 1 ponto em compras acima de R$ 30. Com 25 pontos, troca por um lanche grátis!
          </div>
        </div>
        {fields.map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "1.5px solid #E0E0E0", fontSize: 15, fontFamily: "inherit", outline: "none", background: "#fff" }} />
          </div>
        ))}
        <button onClick={handleRegister} disabled={loading} style={{ background: loading ? "#ccc" : "linear-gradient(135deg,#FF4B2B,#FF6B35)", color: "#fff", border: "none", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 900, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", marginTop: 8, boxShadow: "0 6px 20px rgba(255,75,43,0.3)" }}>
          {loading ? "Criando conta..." : "Criar minha conta 🎉"}
        </button>
        <div style={{ textAlign: "center", fontSize: 14, color: "#888" }}>
          Já tem conta?{" "}
          <span onClick={goLogin} style={{ color: "#FF4B2B", fontWeight: 800, cursor: "pointer" }}>Entrar</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span onClick={goBack} style={{ fontSize: 14, color: "#888", cursor: "pointer" }}>← Voltar ao cardápio</span>
        </div>
      </div>
    </div>
  );
}

// ─── TELA DE PERFIL ───────────────────────────────────────────────────────────
function ProfileScreen({ user, logout, goBack, redeemPoints, POINTS_TO_REDEEM, MAX_CASHBACK }) {
  const canRedeem = user.points >= POINTS_TO_REDEEM;

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F7F8FA", minHeight: "100vh", maxWidth: 480, margin: "0 auto", paddingBottom: 40 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <div style={{ background: "linear-gradient(135deg,#FF4B2B,#FF6B35)", padding: "20px 20px 50px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={goBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Cardápio</button>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 52 }}>👤</div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginTop: 8 }}>{user.name}</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{user.email} • {user.phone}</div>
        </div>
      </div>

      <div style={{ margin: "-24px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, position: "relative", zIndex: 10 }}>
        {[
          { icon: "⭐", value: user.points, label: "Pontos", color: "#F5A623", bg: "#FFF8E1" },
          { icon: "💰", value: `R$${user.cashback.toFixed(2)}`, label: "Cashback", color: "#27AE60", bg: "#F0FFF4" },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: 18, padding: "16px 14px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 28 }}>{card.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: card.color, marginTop: 4 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: "20px 20px 0" }}>
        {/* Pontos */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1A1A2E", marginBottom: 12 }}>⭐ Programa de Pontos</div>
          <div style={{ background: "#F7F8FA", borderRadius: 12, height: 12, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ background: "linear-gradient(90deg,#F5A623,#FF4B2B)", height: "100%", width: `${Math.min((user.points / POINTS_TO_REDEEM) * 100, 100)}%`, borderRadius: 12, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 14 }}>
            <span>{user.points} pontos</span>
            <span>{POINTS_TO_REDEEM} para resgatar</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, background: "#FFF8E1", borderRadius: 10, padding: "8px 12px" }}>
            💡 Compras acima de R$ 30 ganham 1 ponto. Com {POINTS_TO_REDEEM} pontos troque por um X-Burguer Clássico grátis!
          </div>
          <button onClick={redeemPoints} disabled={!canRedeem} style={{ width: "100%", background: canRedeem ? "linear-gradient(135deg,#F5A623,#FF4B2B)" : "#eee", color: canRedeem ? "#fff" : "#aaa", border: "none", borderRadius: 14, padding: "13px", fontSize: 15, fontWeight: 800, cursor: canRedeem ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {canRedeem ? "🎁 Resgatar X-Burguer Grátis!" : `Faltam ${POINTS_TO_REDEEM - user.points} pontos para resgatar`}
          </button>
        </div>

        {/* Cashback */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1A1A2E", marginBottom: 12 }}>💰 Seu Cashback</div>
          <div style={{ background: "#F7F8FA", borderRadius: 12, height: 12, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ background: "linear-gradient(90deg,#27AE60,#2ECC71)", height: "100%", width: `${Math.min((user.cashback / MAX_CASHBACK) * 100, 100)}%`, borderRadius: 12, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 12 }}>
            <span>R$ {user.cashback.toFixed(2)} disponível</span>
            <span>máx R$ {MAX_CASHBACK}</span>
          </div>
          <div style={{ fontSize: 12, color: "#666", background: "#F0FFF4", borderRadius: 10, padding: "8px 12px" }}>
            💡 5% de cashback em toda compra. Use diretamente no carrinho. Máximo de R$ {MAX_CASHBACK} acumulado.
          </div>
        </div>

        {/* Histórico */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1A1A2E", marginBottom: 14 }}>📋 Histórico de Pedidos</div>
          {(!user.orders || user.orders.length === 0) ? (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, padding: "20px 0" }}>Nenhum pedido ainda 🍔</div>
          ) : user.orders.map(order => (
            <div key={order.id} style={{ border: "1.5px solid #F0F0F0", borderRadius: 14, padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#1A1A2E" }}>Pedido #{String(order.id).slice(-4)}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{order.date}</div>
              </div>
              {order.items.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: "#666" }}>{item.qty}x {item.name}</div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #F0F0F0" }}>
                <div style={{ fontWeight: 800, color: "#FF4B2B", fontSize: 14 }}>R$ {order.total.toFixed(2)}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {order.cashbackEarned > 0 && <span style={{ fontSize: 11, color: "#27AE60", fontWeight: 700 }}>+R${order.cashbackEarned.toFixed(2)} cb</span>}
                  {order.pointsEarned > 0 && <span style={{ fontSize: 11, color: "#F5A623", fontWeight: 700 }}>+{order.pointsEarned}pt</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL ADMIN ─────────────────────────────────────────────────────────────
function AdminScreen({ users, goBack }) {
  const [tab, setTab] = useState("clientes");
  const totalRevenue = users.reduce((s, u) => s + (u.orders || []).reduce((os, o) => os + o.total, 0), 0);
  const totalOrders = users.reduce((s, u) => s + (u.orders || []).length, 0);
  const totalCashbackGiven = users.reduce((s, u) => s + (u.orders || []).reduce((os, o) => os + (o.cashbackEarned || 0), 0), 0);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#F7F8FA", minHeight: "100vh", maxWidth: 480, margin: "0 auto", paddingBottom: 40 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <div style={{ background: "linear-gradient(135deg,#1A1A2E,#2D2D5E)", padding: "20px 20px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={goBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>← Cardápio</button>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>🏪 Painel Admin</div>
          <div style={{ width: 80 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Faturamento", value: `R$${totalRevenue.toFixed(0)}`, icon: "💵" },
            { label: "Pedidos", value: totalOrders, icon: "🛒" },
            { label: "Clientes", value: users.length, icon: "👥" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["clientes", "pedidos"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#1A1A2E" : "#fff", color: tab === t ? "#fff" : "#444", border: "none", borderRadius: 12, padding: "8px 18px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {t === "clientes" ? "👥 Clientes" : "📋 Pedidos"}
            </button>
          ))}
        </div>

        {tab === "clientes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {users.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, padding: "40px 0" }}>Nenhum cliente cadastrado ainda</div>
            ) : users.map((u, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{u.email}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{u.phone}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#F5A623", fontWeight: 700 }}>⭐ {u.points} pts</div>
                    <div style={{ fontSize: 12, color: "#27AE60", fontWeight: 700 }}>💰 R${u.cashback.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "#F7F8FA", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#FF4B2B" }}>{(u.orders || []).length}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>pedidos</div>
                  </div>
                  <div style={{ flex: 1, background: "#F7F8FA", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1A1A2E" }}>R${(u.orders || []).reduce((s, o) => s + o.total, 0).toFixed(0)}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>total gasto</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "pedidos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }}>📊 Resumo Financeiro</div>
              {[
                { label: "Total faturado", value: `R$ ${totalRevenue.toFixed(2)}`, color: "#FF4B2B" },
                { label: "Cashback total distribuído", value: `R$ ${totalCashbackGiven.toFixed(2)}`, color: "#27AE60" },
                { label: "Total de pedidos", value: totalOrders, color: "#1A1A2E" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0F0F0" }}>
                  <span style={{ fontSize: 13, color: "#666" }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            {users.flatMap(u => (u.orders || []).map(o => ({ ...o, userName: u.name }))).sort((a, b) => b.id - a.id).map(order => (
              <div key={order.id} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>#{String(order.id).slice(-4)} · {order.userName}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{order.date}</div>
                </div>
                {order.items.map((item, i) => <div key={i} style={{ fontSize: 12, color: "#666" }}>{item.qty}x {item.name}</div>)}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #F0F0F0" }}>
                  <span style={{ fontWeight: 800, color: "#FF4B2B" }}>R$ {order.total.toFixed(2)}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {order.cashbackUsed > 0 && <span style={{ fontSize: 11, color: "#888" }}>−R${order.cashbackUsed.toFixed(2)} cb usado</span>}
                    {order.cashbackEarned > 0 && <span style={{ fontSize: 11, color: "#27AE60", fontWeight: 700 }}>+R${order.cashbackEarned.toFixed(2)} cb</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
