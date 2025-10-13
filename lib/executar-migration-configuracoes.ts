import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

async function executarMigration() {
  try {
    console.log('🚀 Executando migration de configurações...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'migration-configuracoes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar a migration
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao executar migration:', error);
      return;
    }
    
    console.log('✅ Migration executada com sucesso!');
    console.log('📋 Configurações criadas:');
    console.log('   - Tabela configuracoes_sistema');
    console.log('   - Campos de solução nos tickets');
    console.log('   - Status "InAnalysis" adicionado');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarMigration();
}

export { executarMigration };
