/**
 * SAEPChef - Aplicação Web SPA Dinâmica
 * Baseada nas especificações da Prova Prática SENAI
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================
  // ESTADO GLOBAL DA APLICAÇÃO
  // ==========================================================
  let currentUser = null;
  let currentChefFilter = '';

  // Elementos do Cabeçalho
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const headerUserHandle = document.getElementById('headerUserHandle');
  const btnVerPerfil = document.getElementById('btnVerPerfil');
  const btnAuthAction = document.getElementById('btnAuthAction');
  const logoSaepChef = document.getElementById('logoSaepChef');

  // Elementos de Visualização
  const muralView = document.getElementById('muralView');
  const chefRecipesView = document.getElementById('chefRecipesView');
  const recipesGrid = document.getElementById('recipesGrid');
  const muralHeading = document.getElementById('muralHeading');
  const btnResetFilter = document.getElementById('btnResetFilter');
  const btnVoltarMural = document.getElementById('btnVoltarMural');

  // Elementos de Busca
  const inputBuscaChef = document.getElementById('inputBuscaChef');
  const btnBuscarChef = document.getElementById('btnBuscarChef');
  const searchFeedback = document.getElementById('searchFeedback');

  // Elementos do Modal de Login
  const modalLogin = document.getElementById('modalLogin');
  const btnCloseModalLogin = document.getElementById('btnCloseModalLogin');
  const btnCancelLogin = document.getElementById('btnCancelLogin');
  const formLogin = document.getElementById('formLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginSenha = document.getElementById('loginSenha');
  const errorLoginEmail = document.getElementById('errorLoginEmail');
  const errorLoginSenha = document.getElementById('errorLoginSenha');
  const loginGeneralError = document.getElementById('loginGeneralError');

  // Elementos do Menu Lateral (Drawer) do Chef
  const sidebarChef = document.getElementById('sidebarChef');
  const btnCloseSidebar = document.getElementById('btnCloseSidebar');
  const backdrop = document.getElementById('backdrop');
  const sidebarChefAvatar = document.getElementById('sidebarChefAvatar');
  const sidebarChefName = document.getElementById('sidebarChefName');
  const sidebarChefHandle = document.getElementById('sidebarChefHandle');
  const statFavoritos = document.getElementById('statFavoritos');
  const statReceitas = document.getElementById('statReceitas');
  const btnSuasReceitas = document.getElementById('btnSuasReceitas');

  // Elementos do Formulário de Cadastro de Receita
  const formCadastroReceita = document.getElementById('formCadastroReceita');
  const inputTituloReceita = document.getElementById('inputTituloReceita');
  const inputOrigemReceita = document.getElementById('inputOrigemReceita');
  const inputImagemReceita = document.getElementById('inputImagemReceita');
  const fileChosenLabel = document.getElementById('fileChosenLabel');
  const errorTitulo = document.getElementById('errorTitulo');
  const errorOrigem = document.getElementById('errorOrigem');
  const errorImagem = document.getElementById('errorImagem');
  const chefRecipesGrid = document.getElementById('chefRecipesGrid');

  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================
  function init() {
    // Tentar restaurar sessão do localStorage se existir
    const savedUser = localStorage.getItem('saepchef_user');
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
      } catch (e) {
        currentUser = null;
      }
    }

    updateHeaderAuthState();
    loadMuralRecipes();
    setupEventListeners();
  }

  // ==========================================================
  // ATUALIZAÇÃO DO CABEÇALHO E SESSÃO
  // ==========================================================
  function updateHeaderAuthState() {
    if (currentUser) {
      // Usuário Logado
      headerUserAvatar.src = `/imagens_usuarios/${currentUser.imagem_usuario}`;
      headerUserAvatar.alt = currentUser.nome;
      headerUserHandle.textContent = `@${currentUser.nome_usuario}`;
      btnAuthAction.textContent = 'Logout';

      if (currentUser.tipo === 'chef') {
        btnVerPerfil.disabled = false;
        btnVerPerfil.title = 'Acessar painel do chef';
      } else {
        btnVerPerfil.disabled = true;
        btnVerPerfil.title = 'Apenas chefs têm acesso ao perfil';
      }
    } else {
      // Usuário Não Logado
      headerUserAvatar.src = '/imagens_usuarios/saepChef.jpg';
      headerUserAvatar.alt = 'SAEPChef';
      headerUserHandle.textContent = '@SAEPChef';
      btnVerPerfil.disabled = true;
      btnVerPerfil.title = 'Faça login para acessar o perfil';
      btnAuthAction.textContent = 'Login';
    }
  }

  // ==========================================================
  // CONTROLE DO MODAL DE LOGIN
  // ==========================================================
  function openLoginModal() {
    clearLoginForm();
    modalLogin.classList.add('active');
    modalLogin.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('active');
    loginEmail.focus();
  }

  function closeLoginModal() {
    modalLogin.classList.remove('active');
    modalLogin.setAttribute('aria-hidden', 'true');
    if (!sidebarChef.classList.contains('active')) {
      backdrop.classList.remove('active');
    }
    clearLoginForm();
  }

  function clearLoginForm() {
    loginEmail.value = '';
    loginSenha.value = '';
    errorLoginEmail.textContent = '';
    errorLoginSenha.textContent = '';
    loginGeneralError.textContent = '';
    loginEmail.classList.remove('is-invalid');
    loginSenha.classList.remove('is-invalid');
  }

  // Validação e Envio de Login
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailVal = loginEmail.value.trim();
    const senhaVal = loginSenha.value.trim();
    let hasError = false;

    // Reset erros
    errorLoginEmail.textContent = '';
    errorLoginSenha.textContent = '';
    loginGeneralError.textContent = '';
    loginEmail.classList.remove('is-invalid');
    loginSenha.classList.remove('is-invalid');

    // Validação de e-mail (regex padrão: exemplo@dominio.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      errorLoginEmail.textContent = 'E-mail inválido ou vazio';
      loginEmail.classList.add('is-invalid');
      hasError = true;
    }

    // Validação de senha
    if (!senhaVal) {
      errorLoginSenha.textContent = 'A senha é obrigatória e não pode estar vazia';
      loginSenha.classList.add('is-invalid');
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, senha: senhaVal })
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        loginGeneralError.textContent = data.erro || 'Usuário não encontrado ou senha incorreta';
        return;
      }

      // Login bem-sucedido
      currentUser = data.usuario;
      localStorage.setItem('saepchef_user', JSON.stringify(currentUser));

      closeLoginModal();
      updateHeaderAuthState();
      loadMuralRecipes();

    } catch (err) {
      console.error('Erro na requisição de login:', err);
      loginGeneralError.textContent = 'Erro ao conectar ao servidor';
    }
  });

  // Fechamento de modal de login
  btnCloseModalLogin.addEventListener('click', closeLoginModal);
  btnCancelLogin.addEventListener('click', closeLoginModal);

  // ==========================================================
  // LOGOUT
  // ==========================================================
  function handleLogout() {
    currentUser = null;
    localStorage.removeItem('saepchef_user');
    updateHeaderAuthState();
    closeSidebar();
    showMuralView();
    loadMuralRecipes();
  }

  btnAuthAction.addEventListener('click', () => {
    if (currentUser) {
      handleLogout();
    } else {
      openLoginModal();
    }
  });

  // ==========================================================
  // MENU LATERAL (DRAWER) DO CHEF
  // ==========================================================
  async function openSidebar() {
    if (!currentUser || currentUser.tipo !== 'chef') return;

    sidebarChefAvatar.src = `/imagens_usuarios/${currentUser.imagem_usuario}`;
    sidebarChefName.textContent = currentUser.nome;
    sidebarChefHandle.textContent = `@${currentUser.nome_usuario}`;

    // Carregar estatísticas do chef via API
    try {
      const res = await fetch(`/api/chef/${currentUser.id_usuario}/estatisticas`);
      const data = await res.json();
      statFavoritos.textContent = data.total_favoritos || 0;
      statReceitas.textContent = data.total_receitas || 0;
    } catch (e) {
      console.error('Erro ao buscar estatísticas do chef:', e);
    }

    sidebarChef.classList.add('active');
    sidebarChef.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('active');
  }

  function closeSidebar() {
    sidebarChef.classList.remove('active');
    sidebarChef.setAttribute('aria-hidden', 'true');
    if (!modalLogin.classList.contains('active')) {
      backdrop.classList.remove('active');
    }
  }

  btnVerPerfil.addEventListener('click', () => {
    if (!currentUser) {
      openLoginModal();
    } else if (currentUser.tipo === 'chef') {
      openSidebar();
    }
  });

  btnCloseSidebar.addEventListener('click', closeSidebar);
  backdrop.addEventListener('click', () => {
    closeSidebar();
    closeLoginModal();
  });

  // Ao clicar em "Suas receitas" no menu lateral
  btnSuasReceitas.addEventListener('click', () => {
    closeSidebar();
    showChefRecipesView();
  });

  // ==========================================================
  // NAVEGAÇÃO ENTRE TELAS (MURAL vs SUAS RECEITAS)
  // ==========================================================
  function showMuralView() {
    chefRecipesView.style.display = 'none';
    muralView.style.display = 'block';
  }

  function showChefRecipesView() {
    if (!currentUser || currentUser.tipo !== 'chef') {
      showMuralView();
      return;
    }
    muralView.style.display = 'none';
    chefRecipesView.style.display = 'block';
    loadChefRecipesList();
  }

  btnVoltarMural.addEventListener('click', () => {
    showMuralView();
    loadMuralRecipes();
  });

  logoSaepChef.addEventListener('click', () => {
    currentChefFilter = '';
    inputBuscaChef.value = '';
    searchFeedback.textContent = '';
    btnResetFilter.style.display = 'none';
    muralHeading.textContent = 'Receitas da Comunidade';
    showMuralView();
    loadMuralRecipes();
  });

  // ==========================================================
  // MURAL DE RECEITAS (CARREGAMENTO DINÂMICO & FAVORITOS)
  // ==========================================================
  async function loadMuralRecipes(chefQuery = '') {
    const userId = currentUser ? currentUser.id_usuario : '';
    let url = `/api/receitas?id_usuario=${userId}`;
    if (chefQuery) {
      url += `&chef=${encodeURIComponent(chefQuery)}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.encontrado) {
        searchFeedback.textContent = data.mensagem || 'Chef não encontrado';
        recipesGrid.innerHTML = `
          <div class="empty-state">
            <p>Nenhuma receita encontrada para a busca informada.</p>
          </div>
        `;
        return;
      }

      searchFeedback.textContent = '';
      renderRecipesGrid(data.receitas);

    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
      recipesGrid.innerHTML = `
        <div class="empty-state">
          <p>Não foi possível carregar as receitas no momento.</p>
        </div>
      `;
    }
  }

  function renderRecipesGrid(receitas) {
    recipesGrid.innerHTML = '';

    if (!receitas || receitas.length === 0) {
      recipesGrid.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma receita disponível.</p>
        </div>
      `;
      return;
    }

    receitas.forEach(r => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.setAttribute('data-id', r.id_receita);

      const isFavorited = r.favoritado === 1;
      const starClass = isFavorited ? 'favorited' : 'unfavorited';

      card.innerHTML = `
        <div class="recipe-image-container">
          <img src="/receitas/${r.url_imagem}" alt="${escapeHtml(r.titulo_receita)}" class="recipe-image" loading="lazy">
          <div class="recipe-tooltip">
            <span class="tooltip-author">Receita publicada por: @${escapeHtml(r.autor_username)}</span>
            <span class="tooltip-origin">Origem: ${escapeHtml(r.origem_receita)}</span>
          </div>
        </div>

        <div class="recipe-info">
          <h3 class="recipe-title" title="${escapeHtml(r.titulo_receita)}">${escapeHtml(r.titulo_receita)}</h3>
          
          <button type="button" class="recipe-favorite-action" data-recipe-id="${r.id_receita}" title="Favoritar receita">
            <img src="/icones/estrela.svg" alt="Favorito" class="star-icon ${starClass}">
            <span class="favorite-count">${r.total_favoritos}</span>
          </button>
        </div>
      `;

      // Evento de clique no botão de favoritar
      const favBtn = card.querySelector('.recipe-favorite-action');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleToggleFavorite(r.id_receita, favBtn);
      });

      recipesGrid.appendChild(card);
    });
  }

  // Ação de favoritar / desfavoritar
  async function handleToggleFavorite(recipeId, buttonEl) {
    // Se não estiver logado, abre modal de login conforme especificação
    if (!currentUser) {
      openLoginModal();
      return;
    }

    try {
      const response = await fetch('/api/favoritos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: currentUser.id_usuario,
          id_receita: recipeId
        })
      });

      const result = await response.json();

      if (result.sucesso) {
        const starIcon = buttonEl.querySelector('.star-icon');
        const countSpan = buttonEl.querySelector('.favorite-count');

        if (result.favoritado) {
          starIcon.classList.remove('unfavorited');
          starIcon.classList.add('favorited');
        } else {
          starIcon.classList.remove('favorited');
          starIcon.classList.add('unfavorited');
        }

        countSpan.textContent = result.total_favoritos;
      }
    } catch (e) {
      console.error('Erro ao alternar favorito:', e);
    }
  }

  // ==========================================================
  // CAMPO DE BUSCA DE CHEF
  // ==========================================================
  function handleSearchInteraction() {
    // Se não logado, abre o modal de login ao clicar no campo de busca conforme especificado
    if (!currentUser) {
      openLoginModal();
      return false;
    }
    return true;
  }

  inputBuscaChef.addEventListener('click', (e) => {
    if (!handleSearchInteraction()) {
      e.preventDefault();
      inputBuscaChef.blur();
    }
  });

  inputBuscaChef.addEventListener('focus', (e) => {
    if (!handleSearchInteraction()) {
      e.preventDefault();
      inputBuscaChef.blur();
    }
  });

  function performChefSearch() {
    if (!handleSearchInteraction()) return;

    const term = inputBuscaChef.value.trim();

    if (!term) {
      // Se estiver vazio, restaura todas
      currentChefFilter = '';
      searchFeedback.textContent = '';
      btnResetFilter.style.display = 'none';
      muralHeading.textContent = 'Receitas da Comunidade';
      loadMuralRecipes();
      return;
    }

    currentChefFilter = term;
    btnResetFilter.style.display = 'inline-block';
    muralHeading.textContent = `Receitas do chef ${term}`;
    loadMuralRecipes(term);
  }

  btnBuscarChef.addEventListener('click', performChefSearch);
  inputBuscaChef.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performChefSearch();
    }
  });

  btnResetFilter.addEventListener('click', () => {
    inputBuscaChef.value = '';
    currentChefFilter = '';
    searchFeedback.textContent = '';
    btnResetFilter.style.display = 'none';
    muralHeading.textContent = 'Receitas da Comunidade';
    loadMuralRecipes();
  });

  // ==========================================================
  // TELA DE GESTÃO DE RECEITAS DO CHEF
  // ==========================================================
  
  // Custom File Upload Trigger e label de nome do arquivo
  inputImagemReceita.addEventListener('change', () => {
    if (inputImagemReceita.files && inputImagemReceita.files.length > 0) {
      fileChosenLabel.textContent = inputImagemReceita.files[0].name;
      errorImagem.textContent = '';
    } else {
      fileChosenLabel.textContent = 'Nenhum arquivo escolhido';
    }
  });

  // Carregar lista de receitas cadastradas do chef logado
  async function loadChefRecipesList() {
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/chef/${currentUser.id_usuario}/receitas`);
      const data = await res.json();
      renderChefRecipesGrid(data.receitas);
    } catch (e) {
      console.error('Erro ao buscar receitas cadastradas do chef:', e);
    }
  }

  function renderChefRecipesGrid(receitas) {
    chefRecipesGrid.innerHTML = '';

    if (!receitas || receitas.length === 0) {
      chefRecipesGrid.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não cadastrou nenhuma receita.</p>
        </div>
      `;
      return;
    }

    receitas.forEach(r => {
      const card = document.createElement('div');
      card.className = 'chef-recipe-card';
      card.setAttribute('data-id', r.id_receita);

      card.innerHTML = `
        <div class="recipe-image-container">
          <img src="/receitas/${r.url_imagem}" alt="${escapeHtml(r.titulo_receita)}" class="recipe-image" loading="lazy">
        </div>
        <div class="chef-recipe-footer">
          <h4 class="chef-recipe-title" title="${escapeHtml(r.titulo_receita)}">${escapeHtml(r.titulo_receita)}</h4>
          <button type="button" class="btn-delete-recipe" data-id="${r.id_receita}" title="Excluir receita">
            <img src="/icones/lixeira.svg" alt="Excluir" class="icon-lixeira">
          </button>
        </div>
      `;

      // Evento de exclusão
      const btnDelete = card.querySelector('.btn-delete-recipe');
      btnDelete.addEventListener('click', () => {
        handleDeleteRecipe(r.id_receita, card);
      });

      chefRecipesGrid.appendChild(card);
    });
  }

  // Excluir Receita
  async function handleDeleteRecipe(recipeId, cardElement) {
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/receitas/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: currentUser.id_usuario })
      });

      const result = await res.json();

      if (result.sucesso) {
        // Remover card da interface dinamicamente com animação
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.9)';
        setTimeout(() => {
          cardElement.remove();
          if (chefRecipesGrid.children.length === 0) {
            chefRecipesGrid.innerHTML = `
              <div class="empty-state">
                <p>Você ainda não cadastrou nenhuma receita.</p>
              </div>
            `;
          }
        }, 250);
      } else {
        alert(result.erro || 'Erro ao excluir receita');
      }
    } catch (err) {
      console.error('Erro na exclusão da receita:', err);
    }
  }

  // Cadastrar Nova Receita
  formCadastroReceita.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser || currentUser.tipo !== 'chef') return;

    const tituloVal = inputTituloReceita.value.trim();
    const origemVal = inputOrigemReceita.value.trim();
    const file = inputImagemReceita.files[0];

    let hasError = false;

    // Reset erros
    errorTitulo.textContent = '';
    errorOrigem.textContent = '';
    errorImagem.textContent = '';
    inputTituloReceita.classList.remove('is-invalid');
    inputOrigemReceita.classList.remove('is-invalid');

    if (!tituloVal) {
      errorTitulo.textContent = 'O título da receita é obrigatório';
      inputTituloReceita.classList.add('is-invalid');
      hasError = true;
    }

    if (!origemVal) {
      errorOrigem.textContent = 'A origem da receita é obrigatória';
      inputOrigemReceita.classList.add('is-invalid');
      hasError = true;
    }

    if (!file) {
      errorImagem.textContent = 'A imagem da receita é obrigatória';
      hasError = true;
    } else {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        errorImagem.textContent = 'Formatos aceitos: JPG, JPEG, PNG, GIF e WEBP';
        hasError = true;
      }
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append('titulo_receita', tituloVal);
    formData.append('origem_receita', origemVal);
    formData.append('id_usuario', currentUser.id_usuario);
    formData.append('imagem', file);

    try {
      const response = await fetch('/api/receitas', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.sucesso) {
        if (result.erros) {
          if (result.erros.titulo) errorTitulo.textContent = result.erros.titulo;
          if (result.erros.origem) errorOrigem.textContent = result.erros.origem;
          if (result.erros.imagem) errorImagem.textContent = result.erros.imagem;
        } else {
          alert(result.erro || 'Erro ao cadastrar receita');
        }
        return;
      }

      // Sucesso no cadastro
      formCadastroReceita.reset();
      fileChosenLabel.textContent = 'Nenhum arquivo escolhido';

      // Atualizar lista na hora dinamicamente
      loadChefRecipesList();

    } catch (err) {
      console.error('Erro ao enviar receita:', err);
      alert('Erro de conexão ao cadastrar receita');
    }
  });

  // ==========================================================
  // HELPERS
  // ==========================================================
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  function setupEventListeners() {
    // Tecla ESC fecha modais e drawers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLoginModal();
        closeSidebar();
      }
    });
  }

  // Executar inicialização
  init();
});
