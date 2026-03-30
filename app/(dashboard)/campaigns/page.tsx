"use client"

import { AnunciosTable } from "@/components/campanhas/AnunciosTable"

export default function CampaignsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Anúncios com Visualização de Mídia</h1>
        <p className="text-gray-400 text-sm">
          Clique nos ícones de mídia (🖼️ imagem / 🎥 vídeo) na coluna "ANÚNCIO" para visualizar os criativos em alta qualidade.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">🎯 Sistema de Visualização de Criativos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-700 rounded p-3">
            <h3 className="font-semibold text-green-400 mb-2">✅ Funcionalidades Implementadas</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• Visualização de imagens em alta resolução</li>
              <li>• Reprodução de vídeos com controles</li>
              <li>• Cache inteligente para performance</li>
              <li>• Fallback para Biblioteca de Anúncios</li>
              <li>• Prefetch automático de previews</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded p-3">
            <h3 className="font-semibold text-blue-400 mb-2">🚀 Otimizações</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• Cache frontend/backend</li>
              <li>• Batch requests (50 IDs)</li>
              <li>• Lazy loading</li>
              <li>• Prefetch no hover</li>
              <li>• 45min cache (imagens)</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded p-3">
            <h3 className="font-semibold text-yellow-400 mb-2">🛡️ Segurança</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• Validação de URLs</li>
              <li>• SSRF protection</li>
              <li>• Rate limiting</li>
              <li>• Sanitização de inputs</li>
              <li>• Cache headers seguros</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Tabela de Anúncios</h2>
        <AnunciosTable />
      </div>
      
      <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-white font-semibold mb-2">📋 Como Usar:</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong>Visualizar mídia:</strong> Clique nos ícones 🖼️/🎥 na coluna ANÚNCIO</li>
          <li>• <strong>Vídeos:</strong> Clique no botão play para reproduzir</li>
          <li>• <strong>Imagens:</strong> Visualização automática em alta qualidade</li>
          <li>• <strong>Fallback:</strong> Botão 📤 para abrir na Biblioteca de Anúncios</li>
          <li>• <strong>Performance:</strong> Cache automático para carregamento instantâneo</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-white font-semibold mb-2">🔧 APIs Implementadas:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-blue-400 font-semibold mb-1">Backend APIs:</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• <code>/api/meta/creatives</code> - Busca criativos em lote</li>
              <li>• <code>/api/meta/ad-preview</code> - Preview dos anúncios</li>
              <li>• <code>/api/meta/video-url</code> - URLs de vídeo</li>
              <li>• <code>/api/meta/high-quality-image</code> - Imagens HQ</li>
            </ul>
          </div>
          <div>
            <h4 className="text-green-400 font-semibold mb-1">Frontend Features:</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• <code>useCreatives</code> - Hook de cache</li>
              <li>• <code>AdPreviewModal</code> - Modal de visualização</li>
              <li>• <code>AnunciosTable</code> - Tabela com botões de mídia</li>
              <li>• <code>prefetchVideoPreview</code> - Prefetch automático</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
