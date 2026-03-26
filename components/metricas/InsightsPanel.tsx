import { ShogunCard } from "@/components/ui/ShogunCard"
import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"

const INSIGHTS = [
  {
    icon: TrendingUp,
    title: "Performance em alta",
    description:
      "O CPA das últimas 2 semanas caiu 12% em relação ao período anterior. Continue com a estratégia atual de criativos.",
    color: "text-shogun-accent",
  },
  {
    icon: AlertTriangle,
    title: "Atenção ao orçamento",
    description:
      "O gasto diário está 8% acima do planejado. Revise os lances das campanhas de conversão para manter o ritmo.",
    color: "text-shogun-danger",
  },
  {
    icon: Lightbulb,
    title: "Oportunidade identificada",
    description:
      "Criativos com vídeos curtos (< 15s) têm CTR 2.4× maior que imagens estáticas. Considere aumentar o investimento nesse formato.",
    color: "text-shogun-text-secondary",
  },
]

export function InsightsPanel() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {INSIGHTS.map((insight) => {
        const Icon = insight.icon
        return (
          <ShogunCard key={insight.title}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-shogun-bg-elevated flex items-center justify-center shrink-0">
                <Icon size={16} className={insight.color} />
              </div>
              <div>
                <h3 className="text-shogun-text-primary font-[var(--font-display)] font-semibold text-sm">
                  {insight.title}
                </h3>
                <p className="text-shogun-text-secondary text-xs font-[var(--font-display)] mt-1 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </ShogunCard>
        )
      })}
    </div>
  )
}
