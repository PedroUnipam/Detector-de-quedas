// Crie este arquivo na pasta backend como: test-controller.js
// Execute com: node test-controller.js

const userController = require('./controllers/userController');

console.log('🔍 Verificando funções exportadas no userController:\n');

const funcoesEsperadas = [
  'getProfile',
  'updateProfile',
  'changePassword',
  'getCuidadores',
  'getTiposCuidador',
  'addCuidador',
  'updateCuidador',
  'removeCuidador'
];

console.log('✅ Funções encontradas:');
funcoesEsperadas.forEach(funcao => {
  if (userController[funcao]) {
    console.log(`  ✓ ${funcao}`);
  } else {
    console.log(`  ✗ ${funcao} - ❌ FALTANDO!`);
  }
});

console.log('\n📋 Todas as funções exportadas:');
console.log(Object.keys(userController));

console.log('\n💡 Execute este script para ver quais funções estão faltando!');