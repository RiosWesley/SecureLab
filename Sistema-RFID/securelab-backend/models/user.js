// models/user.js
const { database } = require('../config/firebase');
const { ref, set, get, update, remove, push, query, orderByChild, equalTo } = require('firebase/database');
const admin = require('../config/firebase-admin');

class User {
  // Criar um novo usuário
  static async create(userId, userData) {
    try {
      await set(ref(database, `users/${userId}`), userData);
      return { id: userId, ...userData };
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
  }

  // Obter um usuário pelo ID
  static async getById(userId) {
    try {
      const snapshot = await get(ref(database, `users/${userId}`));
      if (snapshot.exists()) {
        return { id: userId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }
  }

  // Atualizar um usuário
  static async update(userId, userData) {
    try {
      await update(ref(database, `users/${userId}`), userData);
      return { id: userId, ...userData };
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  // Excluir um usuário
  static async delete(userId) {
    try {
      await remove(ref(database, `users/${userId}`));
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir usuário: ${error.message}`);
    }
  }

  // Listar todos os usuários
  static async getAll() {
    try {
      const snapshot = await get(ref(database, 'users'));
      if (snapshot.exists()) {
        const users = [];
        snapshot.forEach((childSnapshot) => {
          users.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return users;
      }
      return [];
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  // Buscar usuário por e-mail
  static async getByEmail(email) {
    try {
      const userQuery = query(
        ref(database, 'users'),
        orderByChild('email'),
        equalTo(email)
      );
      
      const snapshot = await get(userQuery);
      if (snapshot.exists()) {
        let user = null;
        snapshot.forEach((childSnapshot) => {
          user = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
        });
        return user;
      }
      return null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por e-mail: ${error.message}`);
    }
  }
}

module.exports = User;