const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- INICIANDO BATERIA DE TESTES DO SISTEMA SAEPCHEF ---');

  // Teste 1: Checar se o frontend (index.html e app.js) é servido
  console.log('\n[Teste 1] Verificando se o frontend (index.html e app.js) é servido na rota raiz...');
  const resHtml = await fetch(`${BASE_URL}/`);
  assert.strictEqual(resHtml.status, 200, 'index.html deve retornar status 200');
  const htmlText = await resHtml.text();
  assert(htmlText.includes('SAEPChef'), 'Página deve conter SAEPChef');
  assert(htmlText.includes('@SAEPChef'), 'Página deve conter @SAEPChef para usuário deslogado');
  
  const resJs = await fetch(`${BASE_URL}/app.js`);
  assert.strictEqual(resJs.status, 200, 'app.js deve retornar status 200');
  const jsText = await resJs.text();
  assert(jsText.includes('estrela.svg'), 'app.js deve referenciar o ícone de estrela');
  assert(jsText.includes('lixeira.svg'), 'app.js deve referenciar o ícone de lixeira');
  console.log('✓ Teste 1 passou: Frontend SPA e scripts servidos com sucesso.');

  // Teste 2: Listar receitas do banco (GET /api/receitas)
  console.log('\n[Teste 2] Verificando listagem de receitas no banco de dados...');
  const resReceitas = await fetch(`${BASE_URL}/api/receitas`);
  const dataReceitas = await resReceitas.json();
  assert.strictEqual(dataReceitas.encontrado, true);
  assert(Array.isArray(dataReceitas.receitas), 'Receitas deve ser um array');
  assert(dataReceitas.receitas.length >= 9, 'Deve haver pelo menos 9 receitas no banco');
  console.log(`✓ Teste 2 passou: ${dataReceitas.receitas.length} receitas carregadas do MySQL.`);

  // Teste 3: Login com credenciais inválidas
  console.log('\n[Teste 3] Verificando login com credenciais incorretas...');
  const resLoginInvalido = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chef1@saepchef.com', senha: 'senha_errada' })
  });
  assert.strictEqual(resLoginInvalido.status, 401);
  const dataLoginInvalido = await resLoginInvalido.json();
  assert.strictEqual(dataLoginInvalido.erro, 'Usuário não encontrado ou senha incorreta');
  console.log('✓ Teste 3 passou: Feedback de erro de credenciais inválidas correto.');

  // Teste 4: Login com campos vazios
  console.log('\n[Teste 4] Verificando login com campos vazios...');
  const resLoginVazio = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '', senha: '' })
  });
  assert.strictEqual(resLoginVazio.status, 400);
  console.log('✓ Teste 4 passou: Rejeição de campos vazios no backend correta.');

  // Teste 5: Login com Chef Marco Bianchi (chef1)
  console.log('\n[Teste 5] Verificando login válido como Chef...');
  const resLoginValido = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chef1@saepchef.com', senha: '123456' })
  });
  assert.strictEqual(resLoginValido.status, 200);
  const dataLoginValido = await resLoginValido.json();
  assert.strictEqual(dataLoginValido.sucesso, true);
  assert.strictEqual(dataLoginValido.usuario.nome_usuario, 'chef1');
  assert.strictEqual(dataLoginValido.usuario.tipo, 'chef');
  console.log('✓ Teste 5 passou: Login do chef realizado com sucesso.');

  // Teste 6: Login com Usuário Comum (Mariana Costa)
  console.log('\n[Teste 6] Verificando login válido como Usuário Comum...');
  const resLoginComum = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'usuario1@gmail.com', senha: '123456' })
  });
  assert.strictEqual(resLoginComum.status, 200);
  const dataLoginComum = await resLoginComum.json();
  assert.strictEqual(dataLoginComum.usuario.tipo, 'comum');
  console.log('✓ Teste 6 passou: Usuário comum identificado corretamente.');

  // Teste 7: Estatísticas do Chef (Menu Lateral)
  console.log('\n[Teste 7] Verificando estatísticas do Chef (favoritos e receitas)...');
  const resStats = await fetch(`${BASE_URL}/api/chef/1/estatisticas`);
  const dataStats = await resStats.json();
  assert(dataStats.total_receitas >= 3, 'Chef 1 deve ter pelo menos 3 receitas');
  assert(typeof dataStats.total_favoritos === 'number', 'Total de favoritos deve ser numérico');
  console.log(`✓ Teste 7 passou: Chef 1 possui ${dataStats.total_receitas} receitas e ${dataStats.total_favoritos} favoritos.`);

  // Teste 8: Alternância de favoritos (Toggle Favorite)
  console.log('\n[Teste 8] Verificando favoritar e desfavoritar receita em tempo real...');
  const resToggle1 = await fetch(`${BASE_URL}/api/favoritos/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_usuario: 5, id_receita: 3 })
  });
  const dataToggle1 = await resToggle1.json();
  assert.strictEqual(dataToggle1.sucesso, true);
  console.log(`  > Toggle 1: favoritado = ${dataToggle1.favoritado}, total = ${dataToggle1.total_favoritos}`);

  const resToggle2 = await fetch(`${BASE_URL}/api/favoritos/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_usuario: 5, id_receita: 3 })
  });
  const dataToggle2 = await resToggle2.json();
  assert.strictEqual(dataToggle2.sucesso, true);
  assert.notStrictEqual(dataToggle1.favoritado, dataToggle2.favoritado, 'O estado de favoritado deve alternar');
  console.log(`  > Toggle 2: favoritado = ${dataToggle2.favoritado}, total = ${dataToggle2.total_favoritos}`);
  console.log('✓ Teste 8 passou: Favoritar e desfavoritar com atualização em tempo real verificado.');

  // Teste 9: Busca por Chef
  console.log('\n[Teste 9] Verificando campo de busca por chef...');
  // Chef existente
  const resBuscaExistente = await fetch(`${BASE_URL}/api/receitas?chef=@chef2`);
  const dataBuscaExistente = await resBuscaExistente.json();
  assert.strictEqual(dataBuscaExistente.encontrado, true);
  assert(dataBuscaExistente.receitas.length > 0, 'Deve retornar receitas do chef2');
  console.log(`✓ Teste 9.1 passou: Busca por @chef2 retornou ${dataBuscaExistente.receitas.length} receitas.`);

  // Chef inexistente
  const resBuscaInexistente = await fetch(`${BASE_URL}/api/receitas?chef=chef_que_nao_existe`);
  const dataBuscaInexistente = await resBuscaInexistente.json();
  assert.strictEqual(dataBuscaInexistente.encontrado, false);
  assert.strictEqual(dataBuscaInexistente.mensagem, 'Chef não encontrado');
  console.log('✓ Teste 9.2 passou: Mensagem "Chef não encontrado" retornada corretamente.');

  // Teste 10: Cadastro e Exclusão de Receita (com Multer e Upload)
  console.log('\n[Teste 10] Verificando cadastro e exclusão de receita com imagem...');
  // Criar uma imagem temporária válida para upload
  const tempImgPath = path.join(__dirname, 'temp_test_image.jpg');
  fs.copyFileSync(path.join(__dirname, 'receitas', 'receita1.jpg'), tempImgPath);

  const FormData = (await import('node:fs')).default;
  const fileBlob = new Blob([fs.readFileSync(tempImgPath)], { type: 'image/jpeg' });
  const form = new globalThis.FormData();
  form.append('titulo_receita', 'Receita Teste Automatizado');
  form.append('origem_receita', 'Brasil');
  form.append('id_usuario', '1');
  form.append('imagem', fileBlob, 'teste.jpg');

  const resCadastro = await fetch(`${BASE_URL}/api/receitas`, {
    method: 'POST',
    body: form
  });

  assert.strictEqual(resCadastro.status, 201);
  const dataCadastro = await resCadastro.json();
  assert.strictEqual(dataCadastro.sucesso, true);
  const novaReceitaId = dataCadastro.id_receita;
  console.log(`  > Receita cadastrada com sucesso! ID: ${novaReceitaId}`);

  // Excluir a receita recém-cadastrada
  const resDelete = await fetch(`${BASE_URL}/api/receitas/${novaReceitaId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_usuario: 1 })
  });
  assert.strictEqual(resDelete.status, 200);
  const dataDelete = await resDelete.json();
  assert.strictEqual(dataDelete.sucesso, true);
  console.log(`  > Receita ID ${novaReceitaId} excluída com sucesso!`);

  // Limpeza
  if (fs.existsSync(tempImgPath)) {
    fs.unlinkSync(tempImgPath);
  }
  console.log('✓ Teste 10 passou: Fluxo completo de cadastro e exclusão de receitas validado.');

  console.log('\n=========================================================');
  console.log('TODOS OS TESTES FORAM CONCLUÍDOS COM 100% DE SUCESSO!');
  console.log('=========================================================\n');
}

runTests().catch(err => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
