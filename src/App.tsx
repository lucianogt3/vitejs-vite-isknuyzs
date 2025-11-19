// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { 
  Trophy, 
  Calendar, 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Camera,
  Send,
  LogOut,
  Info,
  AlertCircle,
  Activity,
  Loader2,
  Lock,
  Mail,
  User
} from 'lucide-react';

// --- FIREBASE SETUP (PRODUÇÃO) ---

const firebaseConfig = {
  apiKey: "AIzaSyD27VCcPz1iYk19GcYe_eXloarMWsPVLLg",
  authDomain: "volei-hsh.firebaseapp.com",
  projectId: "volei-hsh",
  storageBucket: "volei-hsh.firebasestorage.app",
  messagingSenderId: "787774414668",
  appId: "1:787774414668:web:9d4de583d1910e3c3fb9e9",
  measurementId: "G-RY6ZTZZPFV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'volei-hsh'; 

// --- UI COMPONENTS ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = type === 'error' ? 'bg-red-600' : 'bg-green-600';
  const Icon = type === 'error' ? AlertCircle : CheckCircle;

  return (
    <div className={`fixed top-4 right-4 left-4 z-[100] p-4 rounded-xl shadow-2xl flex items-center gap-3 text-white animate-bounce-in ${bgClass}`}>
      <Icon size={24} />
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel, processing }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden mx-4">
      <div className="p-6 text-center">
        <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- SCREENS ---

// 1. AUTH SCREEN (EMAIL & SENHA)
const AuthScreen = ({ addToast }) => {
  const [isLogin, setIsLogin] = useState(true); // Alterna entre Login e Cadastro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (!isLogin && !name.trim()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Cadastro
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // Força recarregar o usuário para pegar o nome atualizado
        await userCredential.user.reload();
      }
    } catch (error) {
      console.error("Auth Error", error);
      let msg = "Erro ao conectar.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') msg = "Email ou senha incorretos.";
      if (error.code === 'auth/email-already-in-use') msg = "Este email já está cadastrado.";
      if (error.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      if (error.code === 'auth/invalid-email') msg = "Email inválido.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center shadow-2xl animate-fade-in">
        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-red-600">
          <Trophy className="text-red-600 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1 drop-shadow-md">VÔLEI HSH</h1>
        <p className="text-red-100 text-xs mb-6 uppercase tracking-widest font-medium">
          {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-3 w-full">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Seu Nome / Apelido"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 focus:bg-white outline-none text-gray-900 text-sm transition-all shadow-inner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Seu Email"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 focus:bg-white outline-none text-gray-900 text-sm transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Sua Senha"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 focus:bg-white outline-none text-gray-900 text-sm transition-all shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-xl active:transform active:scale-95 uppercase tracking-wide flex justify-center items-center gap-2 text-sm mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'ENTRAR' : 'CADASTRAR')}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-white/80 text-xs hover:text-white hover:underline transition-all"
        >
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
        </button>
      </div>
    </div>
  );
};

// 2. RULES MODAL (Mantido)
const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="bg-red-700 p-4 flex justify-between items-center">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Info size={20} /> Regras HSH
        </h3>
        <button onClick={onClose} className="text-red-200 hover:text-white">
          <XCircle size={24} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">
            <CheckCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Presença Confirmada</h4>
            <p className="text-sm text-gray-600">Veio pro jogo? <span className="font-bold text-green-600">+5 pontos</span> no ranking.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-full text-red-600 mt-1">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Furo (Mancada)</h4>
            <p className="text-sm text-gray-600">Confirmou e não apareceu? <span className="font-bold text-red-600">-3 pontos</span>.</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 mt-4">
          Entendi
        </button>
      </div>
    </div>
  </div>
);

// 3. MATCH LIST
const MatchesScreen = ({ user, setActiveTab, addToast, setConfirmDialog }) => {
  const [matches, setMatches] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [newMatch, setNewMatch] = useState({ location: '', date: '', time: '', slots: 14 });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), orderBy('fullDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(matchesData);
    }, (error) => {
      console.error("Error fetching matches:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const createMatch = async (e) => {
    e.preventDefault();
    if (!user) return;
    const fullDate = new Date(`${newMatch.date}T${newMatch.time}`);
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), {
        ...newMatch,
        fullDate: fullDate.toISOString(),
        creatorId: user.uid,
        creatorName: user.displayName || user.email.split('@')[0], // Fallback se não tiver nome
        players: [], 
        status: 'open', 
        createdAt: serverTimestamp()
      });
      setShowCreate(false);
      setNewMatch({ location: '', date: '', time: '', slots: 14 });
      addToast("Partida criada com sucesso!", "success");
    } catch (error) {
      console.error(error);
      addToast("Erro ao criar partida.", "error");
    }
  };

  const togglePresence = async (match) => {
    const isJoined = match.players.some(p => p.uid === user.uid);
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', match.id);

    try {
      if (isJoined) {
        const updatedPlayers = match.players.filter(p => p.uid !== user.uid);
        await updateDoc(matchRef, { players: updatedPlayers });
        addToast("Você saiu da partida.", "success");
      } else {
        if (match.players.length >= match.slots) {
          addToast("Partida lotada!", "error");
          return;
        }
        const newPlayer = { 
          uid: user.uid, 
          name: user.displayName || user.email.split('@')[0], 
          status: 'confirmed' 
        };
        await updateDoc(matchRef, { players: [...match.players, newPlayer] });
        addToast("Presença confirmada! +5 pts (se for).", "success");
      }
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar presença.", "error");
    }
  };

  const handleDeleteRequest = (matchId) => {
    setConfirmDialog({
      title: "Cancelar Partida",
      message: "Tem certeza que deseja deletar esta partida? Isso não pode ser desfeito.",
      action: async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId));
        addToast("Partida deletada.", "success");
      }
    });
  };

  const upcomingMatches = matches.filter(m => m.status !== 'finished');

  return (
    <div className="pb-24 relative bg-gray-50 min-h-full">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      
      <div className="bg-red-700 p-4 sticky top-0 z-10 shadow-md flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-wide">JOGOS HSH</h2>
          <button onClick={() => setShowRules(true)} className="text-red-200 hover:text-white p-1 rounded-full hover:bg-red-600/50">
            <Info size={22} />
          </button>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-white text-red-700 p-2 rounded-full shadow active:scale-90 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      {showCreate && (
        <div className="m-4 p-5 bg-white rounded-xl border-2 border-red-100 shadow-sm animate-fade-in">
          <h3 className="font-bold text-red-700 mb-3 uppercase text-sm">Agendar Nova Partida</h3>
          <form onSubmit={createMatch} className="space-y-3">
            <input 
              className="w-full p-3 rounded-lg border border-gray-200 focus:border-red-500 outline-none" 
              placeholder="Local (ex: Ginásio HSH)" 
              value={newMatch.location}
              onChange={e => setNewMatch({...newMatch, location: e.target.value})}
              required
            />
            <div className="flex gap-2">
              <input 
                type="date" 
                className="w-1/2 p-3 rounded-lg border border-gray-200 focus:border-red-500 outline-none" 
                value={newMatch.date}
                onChange={e => setNewMatch({...newMatch, date: e.target.value})}
                required
              />
              <input 
                type="time" 
                className="w-1/2 p-3 rounded-lg border border-gray-200 focus:border-red-500 outline-none" 
                value={newMatch.time}
                onChange={e => setNewMatch({...newMatch, time: e.target.value})}
                required
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
              <span className="text-sm text-gray-600 font-bold">Vagas Totais:</span>
              <input 
                type="number" 
                className="w-20 p-1 rounded border border-gray-300 text-center" 
                value={newMatch.slots}
                onChange={e => setNewMatch({...newMatch, slots: parseInt(e.target.value)})}
                min="2" max="50"
              />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 uppercase">Confirmar Agendamento</button>
          </form>
        </div>
      )}

      <div className="p-4 space-y-4">
        {upcomingMatches.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
            <Activity size={48} className="mb-4 text-red-200" />
            <p>Nenhum jogo marcado.</p>
            <p className="text-sm">Bora marcar um vôlei?</p>
          </div>
        ) : (
          upcomingMatches.map(match => {
            const isJoined = match.players?.some(p => p.uid === user.uid);
            const spotsLeft = match.slots - (match.players?.length || 0);
            const isCreator = match.creatorId === user.uid;

            return (
              <div key={match.id} className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 uppercase">
                        {match.location}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-2 font-medium">
                        <Calendar size={14} className="text-red-500" />
                        {new Date(match.fullDate).toLocaleDateString('pt-BR')} • {new Date(match.fullDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    {isCreator && (
                      <button onClick={() => handleDeleteRequest(match.id)} className="text-gray-300 hover:text-red-500 p-2">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-gray-700">Lista ({match.players.length}/{match.slots})</span>
                      <span className={`font-bold ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {spotsLeft > 0 ? `Restam ${spotsLeft}` : 'LOTADO'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.players.map((player, idx) => (
                        <span key={idx} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded border-b-2 border-b-gray-200 text-gray-600 font-medium">
                          {player.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-4">
                    <button 
                      onClick={() => togglePresence(match)}
                      disabled={!isJoined && spotsLeft <= 0}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all uppercase text-sm tracking-wide shadow-sm ${
                        isJoined 
                          ? 'bg-white text-red-600 border-2 border-red-100 hover:bg-red-50' 
                          : spotsLeft <= 0 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white shadow hover:bg-red-700'
                      }`}
                    >
                      {isJoined ? 'Sair' : spotsLeft <= 0 ? 'Lotado' : 'Confirmar'}
                    </button>
                    
                    {isCreator && (
                      <button 
                        onClick={() => setActiveTab('admin', match)}
                        className="bg-gray-800 text-white px-6 rounded-lg hover:bg-black font-medium text-sm"
                      >
                        Admin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// 4. MATCH ADMIN (Mantido igual, só com fallback de nome)
const MatchAdmin = ({ match, onBack, addToast, setConfirmDialog }) => {
  const [players, setPlayers] = useState(match.players || []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'matches', match.id), (doc) => {
      if(doc.exists()) {
        setPlayers(doc.data().players || []);
      }
    });
    return () => unsub();
  }, [match.id]);

  const handleFinalizeRequest = () => {
    setConfirmDialog({
      title: "Finalizar Partida?",
      message: "Isso encerrará a partida e distribuirá os pontos para todos os jogadores marcados.",
      action: async () => {
        const batch = writeBatch(db);
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', match.id);
        batch.update(matchRef, { status: 'finished' });

        const pointsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'points');
        let count = 0;

        for (const player of players) {
          let points = 0;
          if (player.outcome === 'present') points = 5;
          if (player.outcome === 'absent') points = -3;

          if (points !== 0) {
            const newPointRecord = doc(pointsCollection);
            batch.set(newPointRecord, {
              userId: player.uid,
              userName: player.name,
              matchId: match.id,
              points: points,
              date: serverTimestamp(),
              matchDate: match.fullDate
            });
            count++;
          }
        }

        await batch.commit();
        addToast(`Sucesso! ${count} jogadores pontuaram.`, "success");
        onBack();
      }
    });
  };

  const setOutcome = async (uid, outcome) => {
    const updatedPlayers = players.map(p => {
      if (p.uid === uid) return { ...p, outcome };
      return p;
    });
    setPlayers(updatedPlayers); 
    
    try {
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', match.id);
      await updateDoc(matchRef, { players: updatedPlayers });
    } catch (error) {
      addToast("Erro ao salvar status.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-red-800 text-white p-4 sticky top-0 z-10 flex items-center gap-3 shadow-md">
        <button onClick={onBack} className="p-1 hover:bg-red-700 rounded-full">← Voltar</button>
        <h2 className="font-bold text-lg">Gerenciar Pontos</h2>
      </div>
      
      <div className="p-4">
        <div className="bg-white border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
          <p className="text-sm text-gray-600">
            <strong>Admin:</strong> Marque 🟩 quem veio e 🟥 quem furou. Depois finalize.
          </p>
        </div>

        <div className="space-y-3">
          {players.length === 0 && <p className="text-center text-gray-500">Ninguém confirmou presença.</p>}
          {players.map(player => (
            <div key={player.uid} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-100">
              <span className="font-medium text-gray-800 truncate w-1/3">{player.name}</span>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setOutcome(player.uid, 'present')}
                  className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                    player.outcome === 'present' 
                    ? 'bg-green-600 text-white shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  Veio (+5)
                </button>
                <button 
                  onClick={() => setOutcome(player.uid, 'absent')}
                  className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                    player.outcome === 'absent' 
                    ? 'bg-red-600 text-white shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  Furo (-3)
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleFinalizeRequest}
          className="w-full mt-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all text-white bg-gray-900 hover:bg-black"
        >
          FINALIZAR PARTIDA
        </button>
      </div>
    </div>
  );
};

// 5. RANKING SCREEN
const RankingScreen = ({ user }) => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'points'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pointsLog = snapshot.docs.map(doc => doc.data());
      const userScores = {};
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      pointsLog.forEach(log => {
        let counts = false;
        const logDate = new Date(log.matchDate);
        
        if (activeTab === 'general') {
          counts = true;
        } else if (activeTab === 'monthly') {
          if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) counts = true;
        }

        if (counts) {
          if (!userScores[log.userId]) {
            userScores[log.userId] = { name: log.userName, total: 0, matches: 0, id: log.userId };
          }
          userScores[log.userId].total += log.points;
          userScores[log.userId].matches += 1;
        }
      });

      setRankings(Object.values(userScores).sort((a, b) => b.total - a.total));
    });
    return () => unsubscribe();
  }, [user, activeTab]);

  return (
    <div className="pb-24 bg-gray-50 min-h-full">
      <div className="bg-red-700 p-6 text-white rounded-b-3xl shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-center mb-4 uppercase tracking-widest">Ranking HSH</h2>
        <div className="flex bg-red-900 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-white text-red-800 shadow' : 'text-red-200 hover:text-white'}`}
          >
            Mensal (Atual)
          </button>
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white text-red-800 shadow' : 'text-red-200 hover:text-white'}`}
          >
            Geral (Eterno)
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {rankings.map((r, index) => (
          <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100">
            <div className={`w-10 h-10 flex items-center justify-center font-bold rounded-full text-sm ${
              index === 0 ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-200' : 
              index === 1 ? 'bg-gray-300 text-gray-800 border-2 border-gray-200' : 
              index === 2 ? 'bg-orange-300 text-orange-900 border-2 border-orange-200' : 'bg-gray-100 text-gray-500'
            }`}>
              {index + 1}º
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{r.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{r.matches} jogos</p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-extrabold text-red-600">{r.total}</span>
              <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">pontos</span>
            </div>
          </div>
        ))}
        {rankings.length === 0 && <div className="text-center text-gray-400 mt-8">Ranking zerado.</div>}
      </div>
    </div>
  );
};

// 6. FEED SCREEN
const FeedScreen = ({ user, addToast }) => {
  const [posts, setPosts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [inputType, setInputType] = useState('text');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'feed'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const sendPost = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'feed'), {
        type: inputType === 'photo' ? 'image' : 'text',
        content: newMessage,
        author: user.displayName || user.email.split('@')[0],
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (e) {
      addToast("Erro ao enviar mensagem.", "error");
    }
  };

  return (
    <div className="pb-24 h-screen flex flex-col bg-gray-100">
      <div className="bg-white p-4 shadow-sm z-10 border-b border-gray-200">
        <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
          Mural da Galera <MessageSquare size={18} />
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {posts.map(post => (
          <div key={post.id} className={`max-w-[85%] ${post.authorId === user.uid ? 'ml-auto' : ''}`}>
             <div className={`text-[10px] text-gray-400 mb-1 font-bold uppercase ${post.authorId === user.uid ? 'text-right' : ''}`}>
               {post.author}
             </div>
             <div className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-200 ${post.authorId === user.uid ? 'bg-red-50 border-red-100 rounded-tr-none text-gray-800' : 'rounded-tl-none'}`}>
                {post.type === 'image' ? (
                  <img src={post.content} alt="Post" className="rounded-lg max-h-60 w-full object-cover bg-gray-200" onError={(e) => {e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300?text=Erro+na+Imagem'}} />
                ) : (
                  <p className="text-gray-800 leading-relaxed break-words text-sm">{post.content}</p>
                )}
             </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-3 border-t border-gray-200">
        <form onSubmit={sendPost} className="flex gap-2 items-center">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button type="button" onClick={() => setInputType('text')} className={`p-2 rounded-full transition-colors ${inputType === 'text' ? 'bg-white shadow text-red-600' : 'text-gray-400'}`}><MessageSquare size={18} /></button>
            <button type="button" onClick={() => setInputType('photo')} className={`p-2 rounded-full transition-colors ${inputType === 'photo' ? 'bg-white shadow text-red-600' : 'text-gray-400'}`}><Camera size={18} /></button>
          </div>
          <input type="text" className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-100 border border-transparent focus:border-red-300 transition-all" placeholder={inputType === 'photo' ? "Cole o link da foto aqui..." : "Digite sua mensagem..."} value={newMessage} onChange={e => setNewMessage(e.target.value)} />
          <button type="submit" className="p-2 bg-red-600 rounded-full text-white shadow hover:bg-red-700 active:scale-90 transition-transform"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
};

// MAIN APP CONTROLLER
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('matches');
  const [adminMatchData, setAdminMatchData] = useState(null);
  
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [processingConfirm, setProcessingConfirm] = useState(false);

  const addToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setProcessingConfirm(true);
    try {
      await confirmDialog.action();
    } catch (e) {
      console.error(e);
      addToast("Ocorreu um erro.", "error");
    } finally {
      setProcessingConfirm(false);
      setConfirmDialog(null);
    }
  };

  useEffect(() => {
    // Apenas monitora o estado. O login é feito na tela de AuthScreen
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false); // Para o loading assim que o firebase decidir se tem user ou nao
    });
    return () => unsubscribe();
  }, []);

  const handleNav = (view, data = null) => {
    setCurrentView(view);
    if (data) setAdminMatchData(data);
  };

  if (loading) return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4 text-red-600" size={48} />
      <p className="font-bold text-lg tracking-widest animate-pulse">CARREGANDO VÔLEI HSH...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="w-full max-w-md bg-gradient-to-b from-red-700 to-red-900 shadow-2xl h-full min-h-screen sm:h-auto sm:min-h-0 sm:rounded-2xl overflow-hidden relative">
           {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
           <AuthScreen addToast={addToast} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 flex justify-center items-start sm:items-center py-0 sm:py-8">
      <div className="w-full max-w-md bg-gray-50 shadow-2xl relative overflow-hidden font-sans sm:rounded-3xl border-x border-gray-200 h-full sm:h-[850px] flex flex-col">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {confirmDialog && (
          <ConfirmModal 
            title={confirmDialog.title} 
            message={confirmDialog.message} 
            onConfirm={handleConfirmAction} 
            onCancel={() => setConfirmDialog(null)}
            processing={processingConfirm}
          />
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {currentView === 'matches' && <MatchesScreen user={user} setActiveTab={handleNav} addToast={addToast} setConfirmDialog={setConfirmDialog} />}
          {currentView === 'ranking' && <RankingScreen user={user} />}
          {currentView === 'feed' && <FeedScreen user={user} addToast={addToast} />}
          {currentView === 'admin' && adminMatchData && <MatchAdmin match={adminMatchData} onBack={() => handleNav('matches')} addToast={addToast} setConfirmDialog={setConfirmDialog} />}
        </div>

        <div className="bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
          <button 
            onClick={() => handleNav('matches')}
            className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${currentView === 'matches' ? 'text-red-600' : 'text-gray-300 hover:text-gray-500'}`}
          >
            <Calendar size={24} strokeWidth={currentView === 'matches' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide uppercase">Jogos</span>
          </button>
          <button 
            onClick={() => handleNav('ranking')}
            className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${currentView === 'ranking' ? 'text-red-600' : 'text-gray-300 hover:text-gray-500'}`}
          >
            <Trophy size={24} strokeWidth={currentView === 'ranking' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide uppercase">Ranking</span>
          </button>
          <button 
            onClick={() => handleNav('feed')}
            className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${currentView === 'feed' ? 'text-red-600' : 'text-gray-300 hover:text-gray-500'}`}
          >
            <MessageSquare size={24} strokeWidth={currentView === 'feed' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide uppercase">Galera</span>
          </button>
        </div>

        <button 
          onClick={() => auth.signOut()}
          className="absolute top-4 right-4 m-2 text-red-100 hover:text-red-600 bg-white/80 rounded-full p-1 shadow-sm z-50 opacity-50 hover:opacity-100 transition-all"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}