// Configuração do Firebase
// Substitua com suas credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAQOogYuOAKJt4irq17qvuOadGTA5dr08o",
    authDomain: "rfid-com-esp32.firebaseapp.com",
    databaseURL: "https://rfid-com-esp32-default-rtdb.firebaseio.com",
    projectId: "rfid-com-esp32",
    storageBucket: "rfid-com-esp32.firebasestorage.app",
    messagingSenderId: "727661669807",
    appId: "1:727661669807:web:daeb96fcd2799e75fe935a"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Referências para serviços do Firebase
  const auth = firebase.auth();
  const database = firebase.database();
  
  // Verificar o estado de autenticação
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log('Usuário autenticado:', user.email);
      loadDashboardData();
    } else {
      console.log('Nenhum usuário autenticado');
      // Redirecionar para a página de login se necessário
      // window.location.href = 'login.html';
    }
  });
  
  // Função para fazer logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch(error => console.error('Erro ao fazer logout:', error));
  });