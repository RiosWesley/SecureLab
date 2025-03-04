// controllers/authController.js
const { auth } = require('../config/firebase');
const admin = require('../config/firebase-admin');
const User = require('../models/user');
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} = require('firebase/auth');

/**
 * Registrar um novo usuário no sistema
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, department, role = 'user' } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Os campos email, password e name são obrigatórios' 
      });
    }
    
    // Verificar se o email já está em uso
    const existingUser = await User.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este email já está em uso' 
      });
    }
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Dados do usuário para o Realtime Database
    const userData = {
      name,
      email,
      role,
      department: department || '',
      created_at: new Date().toISOString(),
      last_login: null,
      status: 'active'
    };
    
    // Salvar no Realtime Database
    await User.create(uid, userData);
    
    // Criar claims personalizadas para o usuário (roles)
    await admin.auth().setCustomUserClaims(uid, { role });
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      userId: uid
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    
    // Mensagens de erro mais amigáveis
    if (error.code === 'auth/email-already-in-use') {
      return res.status(400).json({ 
        success: false, 
        message: 'Este email já está em uso' 
      });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({ 
        success: false, 
        message: 'A senha é muito fraca. Use pelo menos 6 caracteres' 
      });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        success: false, 
        message: 'O formato do email é inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao registrar usuário', 
      error: error.message 
    });
  }
};

/**
 * Autenticar usuário
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Autenticar com Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Buscar dados adicionais do usuário
    const userData = await User.getById(firebaseUser.uid);
    
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dados do usuário não encontrados' 
      });
    }
    
    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      await signOut(auth);
      return res.status(403).json({ 
        success: false, 
        message: 'Conta desativada. Entre em contato com o administrador.' 
      });
    }
    
    // Atualizar último login
    await User.update(firebaseUser.uid, {
      last_login: new Date().toISOString()
    });
    
    // Gerar token customizado com o Admin SDK
    const token = await firebaseUser.getIdToken();
    
    // Obter claims personalizadas (role)
    const idTokenResult = await firebaseUser.getIdTokenResult();
    const role = idTokenResult.claims.role || 'user';
    
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.name,
        role,
        department: userData.department,
        status: userData.status
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    
    // Mensagens de erro mais amigáveis
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou senha incorretos' 
      });
    } else if (error.code === 'auth/too-many-requests') {
      return res.status(429).json({ 
        success: false, 
        message: 'Muitas tentativas de login. Tente novamente mais tarde.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer login', 
      error: error.message 
    });
  }
};

/**
 * Encerrar a sessão do usuário
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    await signOut(auth);
    res.status(200).json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer logout', 
      error: error.message 
    });
  }
};

/**
 * Verificar o status da autenticação
 * @route GET /api/auth/check
 */
exports.checkAuth = async (req, res) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return res.status(200).json({ 
        authenticated: false 
      });
    }
    
    // Obter dados adicionais do usuário
    const userData = await User.getById(currentUser.uid);
    
    if (!userData) {
      return res.status(200).json({ 
        authenticated: false,
        message: 'Dados do usuário não encontrados'
      });
    }
    
    // Obter claims personalizadas (role)
    const idTokenResult = await currentUser.getIdTokenResult();
    const role = idTokenResult.claims.role || 'user';
    
    res.status(200).json({ 
      authenticated: true,
      user: {
        id: currentUser.uid,
        email: currentUser.email,
        name: userData.name,
        role,
        department: userData.department,
        status: userData.status
      }
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar autenticação', 
      error: error.message 
    });
  }
};

/**
 * Iniciar processo de recuperação de senha
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email é obrigatório' 
      });
    }
    
    // Verificar se o usuário existe
    const existingUser = await User.getByEmail(email);
    if (!existingUser) {
      // Por questões de segurança, não informamos se o email existe ou não
      return res.status(200).json({ 
        success: true, 
        message: 'Se o email estiver cadastrado, você receberá um link para recuperação de senha' 
      });
    }
    
    await sendPasswordResetEmail(auth, email);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email de recuperação enviado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    
    // Não revelamos o erro específico para o usuário por questões de segurança
    res.status(200).json({ 
      success: true, 
      message: 'Se o email estiver cadastrado, você receberá um link para recuperação de senha' 
    });
  }
};

/**
 * Alterar senha do usuário logado
 * @route POST /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = auth.currentUser;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha atual e nova senha são obrigatórias' 
      });
    }
    
    // Reautenticar o usuário (necessário para operações sensíveis)
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    
    await reauthenticateWithCredential(user, credential);
    
    // Alterar a senha
    await updatePassword(user, newPassword);
    
    res.status(200).json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    
    if (error.code === 'auth/wrong-password') {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha atual incorreta' 
      });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({ 
        success: false, 
        message: 'A nova senha é muito fraca. Use pelo menos 6 caracteres' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao alterar senha', 
      error: error.message 
    });
  }
};

/**
 * Renovar token de acesso
 * @route POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }
    
    // Forçar a atualização do token
    const token = await user.getIdToken(true);
    
    res.status(200).json({ 
      success: true, 
      token 
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao renovar token', 
      error: error.message 
    });
  }
};